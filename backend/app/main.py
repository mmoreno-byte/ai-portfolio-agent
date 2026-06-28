import os
import shutil
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from app.database import engine, Base, get_db
from app import models
from app import rag_service

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Portfolio Agent API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/health")
def health_check():
    return {"status": "ok", "message": "Backend funcionando correctamente"}


@app.post("/documents/upload")
def upload_document(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    db_document = models.Document(filename=file.filename)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)

    collection_name = f"doc_{db_document.id}"
    try:
        num_chunks = rag_service.process_document(file_path, collection_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando documento: {str(e)}")

    return {
        "id": db_document.id,
        "filename": db_document.filename,
        "chunks_created": num_chunks
    }


@app.post("/documents/{document_id}/ask")
def ask_question(document_id: int, question: str, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    collection_name = f"doc_{document.id}"
    try:
        answer = rag_service.query_document(question, collection_name)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error consultando RAG: {str(e)}")

    conversation = models.Conversation(
        document_id=document.id,
        question=question,
        answer=answer
    )
    db.add(conversation)
    db.commit()

    return {"question": question, "answer": answer}


@app.get("/documents")
def list_documents(db: Session = Depends(get_db)):
    documents = db.query(models.Document).all()
    return documents


@app.get("/documents/{document_id}/history")
def get_history(document_id: int, db: Session = Depends(get_db)):
    conversations = db.query(models.Conversation).filter(
        models.Conversation.document_id == document_id
    ).order_by(models.Conversation.created_at).all()
    return conversations

@app.delete("/documents/{document_id}")
def delete_document(document_id: int, db: Session = Depends(get_db)):
    document = db.query(models.Document).filter(models.Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    # Borrar el archivo físico
    file_path = os.path.join(UPLOAD_DIR, document.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    # Borrar la colección de ChromaDB
    collection_name = f"doc_{document.id}"
    try:
        rag_service.delete_collection(collection_name)
    except Exception as e:
        print(f"Aviso: no se pudo borrar la colección de Chroma: {e}")

    # Borrar conversaciones asociadas y el documento (en ese orden por la FK)
    db.query(models.Conversation).filter(models.Conversation.document_id == document_id).delete()
    db.delete(document)
    db.commit()

    return {"message": "Documento eliminado correctamente"}