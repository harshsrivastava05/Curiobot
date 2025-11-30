from fastapi import APIRouter, UploadFile, File, Depends, BackgroundTasks, HTTPException
from app.core.security import get_current_user
from app.services.gcs import gcs_service
from app.db.prisma import db
from app.services.processing import process_document
import uuid

router = APIRouter()

@router.post("/")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user)
):
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type. Only PDF and DOCX are supported.")

    # Generate unique filename
    file_ext = file.filename.split(".")[-1]
    filename = f"{user['sub']}/{uuid.uuid4()}.{file_ext}" # user['sub'] is the user ID
    
    # Upload to GCS
    try:
        # Note: upload_file is synchronous in google-cloud-storage, but we can run it? 
        # Actually my GCSService.upload_file is synchronous. 
        # Ideally should run in threadpool, but for now direct call.
        gcs_url = gcs_service.upload_file(file.file, filename, file.content_type)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

    # Create DB record
    try:
        doc = await db.document.create(
            data={
                "userId": user['sub'],
                "name": file.filename,
                "fileUrl": gcs_url,
                "status": "processing"
            }
        )
    except Exception as e:
        # Cleanup GCS if DB fails? For now just error
        raise HTTPException(status_code=500, detail=f"Database error (Document): {str(e)}")

    # Trigger background task
    background_tasks.add_task(process_document, doc.id, gcs_url, filename)

    return {"id": doc.id, "status": "processing", "message": "File uploaded and processing started"}
