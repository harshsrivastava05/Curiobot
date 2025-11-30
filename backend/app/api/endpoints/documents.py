from fastapi import APIRouter, Depends, HTTPException
from app.db.prisma import db
from app.core.security import get_current_user

router = APIRouter()

@router.get("/")
async def get_documents(user: dict = Depends(get_current_user)):
    documents = await db.document.find_many(
        where={"userId": user['sub']},
        order={"createdAt": "desc"}
    )
    return documents

@router.get("/{document_id}")
async def get_document_details(document_id: str, user: dict = Depends(get_current_user)):
    document = await db.document.find_unique(
        where={"id": document_id},
        include={"documentData": True}
    )
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.userId != user['sub']:
        raise HTTPException(status_code=403, detail="Not authorized to view this document")
        
    progress = 0
    if document.status == "processing":
        from app.core.redis import redis_client
        p = await redis_client.get(f"progress:{document_id}")
        if p:
            progress = int(p)
    elif document.status == "ready":
        progress = 100

    # Generate signed URL
    from app.services.gcs import gcs_service
    # Assuming the blob name is stored in document.gcsUrl or we can derive it.
    # Wait, the schema has gcsUrl which is the public URL. 
    # But for signed URL we need the blob name.
    # The gcsUrl is likely "https://storage.googleapis.com/BUCKET/BLOBNAME"
    # Let's extract blob name from gcsUrl or just use the filename if we stored it?
    # We didn't explicitly store blob_name in Document model, but we stored gcsUrl.
    # Let's assume gcsUrl is the public URL and extract blob name.
    # Actually, in upload.py we did: gcs_url = gcs_service.upload_file(...)
    # And gcs_service.upload_file returns blob.public_url.
    # Public URL format: https://storage.googleapis.com/BUCKET_NAME/BLOB_NAME
    
    file_url = document.fileUrl
    try:
        if document.fileUrl:
            # Extract blob name
            # Split by bucket name
            from app.core.config import get_settings
            settings = get_settings()
            bucket_part = f"/{settings.BUCKET_NAME}/"
            if bucket_part in document.fileUrl:
                blob_name = document.fileUrl.split(bucket_part)[1]
                file_url = gcs_service.generate_signed_url(blob_name)
    except Exception as e:
        print(f"Error generating signed URL: {e}")

    return {
        "id": document.id,
        "name": document.name,
        "status": document.status,
        "progress": progress,
        "fileUrl": file_url,
        "topics": document.documentData.topics if document.documentData else [],
        "explanations": document.documentData.explanations if document.documentData else {},
        "mindTree": document.documentData.mindTree if document.documentData else {},
        "predictedQuestions": document.documentData.predictedQuestions if document.documentData else [],
    }

@router.delete("/{document_id}")
async def delete_document(document_id: str, user: dict = Depends(get_current_user)):
    document = await db.document.find_unique(where={"id": document_id})
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
        
    if document.userId != user['sub']:
        raise HTTPException(status_code=403, detail="Not authorized to delete this document")

    # Delete from GCS
    if document.fileUrl:
        try:
            from app.services.gcs import gcs_service
            from app.core.config import get_settings
            settings = get_settings()
            bucket_part = f"/{settings.BUCKET_NAME}/"
            if bucket_part in document.fileUrl:
                blob_name = document.fileUrl.split(bucket_part)[1]
                gcs_service.delete_file(blob_name)
        except Exception as e:
            print(f"Error deleting file from GCS: {e}")

    # Delete from DB (Cascade delete should handle related data if configured, otherwise delete manually)
    # Prisma schema doesn't show cascade delete on relations explicitly in the snippet, 
    # but usually it's handled if configured. 
    # Let's delete related data first to be safe or rely on Prisma's onDelete: Cascade if set.
    # Looking at schema, no onDelete: Cascade is visible in the snippet provided earlier.
    # So we should delete DocumentData and VectorMetadata first.
    
    await db.documentdata.delete_many(where={"documentId": document_id})
    await db.vectormetadata.delete_many(where={"documentId": document_id})
    await db.document.delete(where={"id": document_id})
    
    return {"message": "Document deleted successfully"}
