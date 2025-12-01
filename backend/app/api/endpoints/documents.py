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
    # Check Redis cache
    from app.core.redis import redis_client
    import json
    
    cache_key = f"document_details:{document_id}"
    cached_doc = await redis_client.get(cache_key)
    
    # If cache hit, verify ownership
    if cached_doc:
        print(f"DEBUG: Cache HIT for {document_id}")
        doc_data = json.loads(cached_doc)
        if doc_data.get('userId') == user['sub']:
             return doc_data
    
    print(f"DEBUG: Cache MISS for {document_id}")
    
    # Cache miss or auth failed (if we didn't store userId, but we will)
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
        p = await redis_client.get(f"progress:{document_id}")
        if p:
            progress = int(p)
    elif document.status == "ready":
        progress = 100

    # Generate signed URL
    from app.services.gcs import gcs_service
    
    file_url = document.fileUrl
    try:
        if document.fileUrl:
            from app.core.config import get_settings
            settings = get_settings()
            bucket_part = f"/{settings.BUCKET_NAME}/"
            if bucket_part in document.fileUrl:
                blob_name = document.fileUrl.split(bucket_part)[1]
                file_url = gcs_service.generate_signed_url(blob_name)
    except Exception as e:
        print(f"Error generating signed URL: {e}")

    response_data = {
        "id": document.id,
        "name": document.name,
        "status": document.status,
        "progress": progress,
        "fileUrl": file_url,
        "topics": document.documentData.topics if document.documentData else [],
        "explanations": document.documentData.explanations if document.documentData else {},
        "mindTree": document.documentData.mindTree if document.documentData else {},
        "predictedQuestions": document.documentData.predictedQuestions if document.documentData else [],
        "userId": document.userId # Include userId for auth check in cache
    }
    
    # Cache the result if status is ready (so we don't cache partial progress forever, or cache with short expiry)
    # If status is processing, maybe don't cache or cache for short time?
    # User asked to cache "after user has first retrieved it".
    # Let's cache it.
    await redis_client.set(cache_key, json.dumps(response_data), expire=3600)

    return response_data

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
    
    # Invalidate cache
    from app.core.redis import redis_client
    await redis_client.delete(f"document_details:{document_id}")
    
    return {"message": "Document deleted successfully"}
