import { deleteDocument } from '../api';

function DocumentList({ documents, selectedDocId, onSelectDocument, onDeleted }) {
  const handleDelete = async (e, docId) => {
    e.stopPropagation();
    if (!window.confirm('¿Eliminar este documento y su historial?')) return;

    try {
      await deleteDocument(docId);
      onDeleted(docId);
    } catch (err) {
      console.error('Error al eliminar:', err);
    }
  };

  return (
    <div className="panel">
      <p className="panel-label">Documentos ({documents.length})</p>

      {documents.length === 0 ? (
        <p className="empty-state">Todavía no hay nada aquí. Sube tu primer PDF arriba.</p>
      ) : (
        <ul className="doc-list">
          {documents.map((doc, i) => (
            <li
              key={doc.id}
              className={`doc-card ${doc.id === selectedDocId ? 'selected' : ''}`}
              style={{ animationDelay: `${i * 0.04}s` }}
              onClick={() => onSelectDocument(doc.id)}
            >
              <span className="doc-card-name">{doc.filename}</span>
              <button
                className="doc-card-delete"
                onClick={(e) => handleDelete(e, doc.id)}
                title="Eliminar documento"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DocumentList;