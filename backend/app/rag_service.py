import os
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_cohere import CohereEmbeddings
from langchain_groq import ChatGroq
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langdetect import detect

CHROMA_DIR = "/app/chroma_db"

# Embeddings vía API de Cohere y modelo de chat vía Groq (ambos gratis, en la nube):
# Ollama necesitaba varios GB de RAM para un LLM local, y un modelo de embeddings
# cargado en el propio contenedor tampoco cabe en los 512MB del free tier de Render.
embeddings = CohereEmbeddings(model="embed-multilingual-v3.0", cohere_api_key=os.getenv("COHERE_API_KEY"))
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"))

LANGUAGE_NAMES = {
    "es": "Spanish",
    "en": "English",
    "fr": "French",
    "de": "German",
    "pt": "Portuguese",
    "it": "Italian",
}

PROMPT_TEMPLATE = """Answer the question using only the context below.

IMPORTANT: You MUST write your entire answer in {language}. Do not use any other language, even if the context is written in a different language.

Context:
{context}

Question: {question}

Answer (written entirely in {language}):"""

custom_prompt = PromptTemplate(
    template=PROMPT_TEMPLATE,
    input_variables=["context", "question", "language"]
)


def process_document(file_path: str, collection_name: str):
    """Carga un PDF, lo divide en chunks y lo guarda en ChromaDB"""
    loader = PyPDFLoader(file_path)
    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(chunk_size=800, chunk_overlap=300)
    chunks = splitter.split_documents(documents)

    vectorstore = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=collection_name,
        persist_directory=CHROMA_DIR
    )
    return len(chunks)


def query_document(question: str, collection_name: str):
    """Hace una pregunta sobre un documento ya procesado"""
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )

    retriever = vectorstore.as_retriever(search_kwargs={"k": 5})

    # Detectar idioma de la pregunta
    try:
        lang_code = detect(question)
        language = LANGUAGE_NAMES.get(lang_code, "Spanish")
    except Exception:
        language = "Spanish"

    print(f"DEBUG - Pregunta: '{question}' | Idioma detectado: {lang_code} -> {language}")

    docs = retriever.invoke(question)
    context = "\n\n".join(doc.page_content for doc in docs)

    final_prompt = custom_prompt.format(
        context=context,
        question=question,
        language=language
    )

    result = llm.invoke(final_prompt)
    return result.content

def delete_collection(collection_name: str):
    """Borra una colección completa de ChromaDB"""
    vectorstore = Chroma(
        collection_name=collection_name,
        embedding_function=embeddings,
        persist_directory=CHROMA_DIR
    )
    vectorstore.delete_collection()