import { useState } from 'react';
import { uploadDocument } from '../api';

function DocumentUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setError(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile);
      setError(null);
    } else {
      setError('Solo se aceptan archivos PDF');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Selecciona un archivo PDF primero');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await uploadDocument(file);
      onUploadSuccess(result);
      setFile(null);
    } catch (err) {
      setError('Error al subir el documento: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel">
      <p className="panel-label">Subir documento</p>

      <div
        className={`dropzone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept=".pdf" onChange={handleFileChange} />
        <div className="dropzone-text">
          {file ? 'Archivo listo para procesar' : 'Arrastra un PDF o haz clic para elegirlo'}
        </div>
        {file && <div className="dropzone-filename">{file.name}</div>}
      </div>

      <button className="btn" onClick={handleUpload} disabled={loading || !file}>
        {loading ? 'Procesando documento…' : 'Subir y procesar'}
      </button>

      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

export default DocumentUpload;