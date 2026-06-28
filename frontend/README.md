# 📚 RAG Document Agent

Agente conversacional que permite subir documentos PDF y hacerles preguntas en lenguaje natural, en **cualquier idioma**. Todo el procesamiento (embeddings + generación de respuestas) corre en **local**, sin enviar datos a servicios externos.

![Status](https://img.shields.io/badge/status-functional-success)
![Docker](https://img.shields.io/badge/docker-ready-blue)

---

## ✨ Características

- 📄 Sube PDFs y conviértelos en una base de conocimiento consultable
- 💬 Pregunta en lenguaje natural — el agente responde **en el mismo idioma** de la pregunta, sin importar el idioma del documento
- 🧠 RAG (Retrieval-Augmented Generation) con búsqueda semántica real, no palabras clave
- 🗂️ Historial de conversaciones persistente por documento
- 🗑️ Gestión completa: sube, consulta y elimina documentos desde la interfaz
- 🐳 Stack completo en Docker — un solo comando lo levanta todo
- 🔒 100% local — usa modelos de Ollama, ningún dato sale de tu máquina

---

## 🏗️ Arquitectura

┌─────────────┐      ┌──────────────┐      ┌─────────────┐

│   React     │ ───▶ │   FastAPI    │ ───▶ │  ChromaDB   │

│  (Vite)     │      │   Backend    │      │  (vectores) │

└─────────────┘      └──────┬───────┘      └─────────────┘

│

┌──────────┴──────────┐

▼                     ▼

┌──────────────┐      ┌──────────────┐

│  PostgreSQL  │      │    Ollama     │

│  (historial) │      │ (LLM local)   │

└──────────────┘      └──────────────┘

**Flujo de un documento:**
1. El PDF se sube desde React al backend
2. FastAPI lo divide en fragmentos (*chunks*) con LangChain
3. Cada fragmento se convierte en un vector con `nomic-embed-text` y se guarda en ChromaDB
4. Al preguntar, se detecta el idioma de la pregunta, se recuperan los fragmentos más relevantes y se generan con `llama3.2` una respuesta en ese idioma
5. La conversación (pregunta + respuesta) se guarda en PostgreSQL

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|---|---|
| Frontend | React 19, Vite, Axios |
| Backend | FastAPI, SQLAlchemy, Uvicorn |
| Base de datos | PostgreSQL 16 |
| Vector store | ChromaDB |
| Orquestación RAG | LangChain |
| LLM y embeddings | Ollama (`llama3.2`, `nomic-embed-text`) |
| Infraestructura | Docker, Docker Compose |
| Detección de idioma | langdetect |

---

## 🚀 Cómo levantarlo en local

### Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- [Ollama](https://ollama.com/) instalado en tu máquina (no en Docker)

### 1. Clona el repositorio

```bash
git clone https://github.com/TU_USUARIO/ai-portfolio-agent.git
cd ai-portfolio-agent
```

### 2. Descarga los modelos de Ollama

```bash
ollama pull llama3.2
ollama pull nomic-embed-text
```

Asegúrate de que la aplicación de Ollama está abierta (o `ollama serve` corriendo).

### 3. Levanta el stack completo

```bash
docker-compose up --build
```

Esto construye y levanta tres contenedores: PostgreSQL, el backend FastAPI y el frontend React.

### 4. Abre la aplicación

Ve a [http://localhost:5173](http://localhost:5173) y empieza a subir documentos.

> La API también está disponible directamente en `http://localhost:8000/docs` (Swagger UI interactivo).

---

## 📂 Estructura del proyecto

## 📂 Estructura del proyecto
ai-portfolio-agent/

├── backend/

│   ├── app/

│   │   ├── main.py          # Endpoints de la API

│   │   ├── database.py      # Configuración de SQLAlchemy

│   │   ├── models.py        # Modelos de datos (Document, Conversation)

│   │   └── rag_service.py   # Lógica de RAG: chunking, embeddings, consulta

│   ├── requirements.txt

│   └── Dockerfile

├── frontend/

│   ├── src/

│   │   ├── components/       # DocumentUpload, DocumentList, ChatBox

│   │   ├── api.js            # Cliente HTTP hacia el backend

│   │   └── App.jsx

│   └── Dockerfile

└── docker-compose.yml

---

## 🌐 Endpoints principales

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/documents/upload` | Sube y procesa un PDF |
| `POST` | `/documents/{id}/ask` | Pregunta sobre un documento |
| `GET` | `/documents` | Lista los documentos subidos |
| `GET` | `/documents/{id}/history` | Historial de conversación de un documento |
| `DELETE` | `/documents/{id}` | Elimina un documento y su historial |

---

## 🧪 Decisiones técnicas destacadas

- **Modelos separados para embeddings y generación**: `nomic-embed-text` para vectorización y `llama3.2` para generar respuestas — usar un modelo de chat para embeddings no funciona y da error.
- **Respuesta en el idioma de la pregunta, no del documento**: se detecta el idioma con `langdetect` y se fuerza explícitamente en el prompt, ya que el LLM tiende a "copiar" el idioma del contexto recuperado si no se le indica lo contrario.
- **Una colección de ChromaDB por documento**: aísla el contexto de búsqueda y permite borrar documentos de forma limpia sin afectar a los demás.

---

## 📄 Licencia

Este proyecto es de uso libre con fines de portfolio y aprendizaje.

