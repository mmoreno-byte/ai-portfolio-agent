import { useState, useEffect } from 'react';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import ChatBox from './components/ChatBox';
import { getDocuments } from './api';
import './App.css';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const data = await getDocuments();
      setDocuments(data);
    } catch (err) {
      console.error('Error cargando documentos:', err);
    }
  };

  const handleUploadSuccess = (newDoc) => {
    loadDocuments();
    setSelectedDocId(newDoc.id);
  };

  const handleDeleted = (deletedId) => {
    setDocuments((prev) => prev.filter((d) => d.id !== deletedId));
    if (selectedDocId === deletedId) {
      setSelectedDocId(null);
    }
  };

  const selectedDoc = documents.find((d) => d.id === selectedDocId);

  return (
    <div className="app">
      <header className="app-header">
        <p className="app-eyebrow">Agente RAG personal</p>
        <h1>Pregúntale a tus documentos</h1>
        <p className="app-subtitle">
          Sube un PDF y conversa con él en el idioma que prefieras.
          Todo se procesa con un modelo local, sin enviar nada a servicios externos.
        </p>
      </header>

      <div className="app-layout">
        <aside className="sidebar">
          <DocumentUpload onUploadSuccess={handleUploadSuccess} />
          <DocumentList
            documents={documents}
            selectedDocId={selectedDocId}
            onSelectDocument={setSelectedDocId}
            onDeleted={handleDeleted}
          />
        </aside>

        <main>
          <ChatBox
            documentId={selectedDocId}
            documentName={selectedDoc?.filename}
          />
        </main>
      </div>
    </div>
  );
}

export default App;