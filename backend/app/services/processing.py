from app.db.prisma import db
from app.services.gcs import gcs_service
from app.services.analysis import run_analysis
from app.core.redis import redis_client
import fitz # PyMuPDF
import asyncio

async def process_document(document_id: str, gcs_url: str, blob_name: str):
    try:
        # Update status to processing
        await db.document.update(
            where={"id": document_id},
            data={"status": "processing"}
        )

        # Download file
        await redis_client.set(f"progress:{document_id}", "10")
        file_content = gcs_service.download_as_bytes(blob_name)
        
        # Extract text
        await redis_client.set(f"progress:{document_id}", "20")
        text = ""
        if blob_name.endswith(".pdf"):
            doc = fitz.open(stream=file_content, filetype="pdf")
            for page in doc:
                text += page.get_text()
        # Add DOCX support here if needed
        
        if not text:
            raise Exception("Could not extract text")

        # LangGraph Analysis
        await redis_client.set(f"progress:{document_id}", "40")
        analysis_result = await run_analysis(text)
        
        topics = analysis_result.get("topics", [])
        explanations = analysis_result.get("explanations", {})
        mind_tree = analysis_result.get("mind_tree", {})
        questions = analysis_result.get("questions", [])

        # Chunk text for embeddings (Simple chunking for now)
        await redis_client.set(f"progress:{document_id}", "70")
        chunk_size = 1000
        chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
        
        # Generate and store embeddings
        from app.services.vector_store import upsert_vectors
        await upsert_vectors(document_id, chunks)

        # Save data
        await redis_client.set(f"progress:{document_id}", "90")
        print(f"Saving data for {document_id}")
        
        import json
        
        # Retry logic for DB connection
        max_retries = 3
        for attempt in range(max_retries):
            try:
                if not db.is_connected():
                    print("Reconnecting to DB...")
                    await db.connect()
                    
                await db.documentdata.create(
                    data={
                        "documentId": document_id,
                        "topics": json.dumps(topics),
                        "explanations": json.dumps(explanations),
                        "mindTree": json.dumps(mind_tree),
                        "predictedQuestions": json.dumps(questions)
                    }
                )
                break # Success
            except Exception as e:
                print(f"DB Save failed (attempt {attempt+1}/{max_retries}): {e}")
                if attempt == max_retries - 1:
                    raise e
                await asyncio.sleep(1)

        # Update status to ready
        await redis_client.set(f"progress:{document_id}", "100")

        # Update status to ready
        await db.document.update(
            where={"id": document_id},
            data={"status": "ready"}
        )

    except Exception as e:
        print(f"Processing failed for {document_id}: {e}")
        await db.document.update(
            where={"id": document_id},
            data={"status": "failed"}
        )
