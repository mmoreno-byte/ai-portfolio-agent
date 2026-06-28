import { useState, useEffect, useRef } from 'react';
import { askQuestion, getHistory } from '../api';

function ChatBox({ documentId, documentName }) {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const historyEndRef = useRef(null);

  useEffect(() => {
    if (documentId) {
      loadHistory();
    } else {
      setHistory([]);
    }
  }, [documentId]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const loadHistory = async () => {
    try {
      const data = await getHistory(documentId);
      setHistory(data);
    } catch (err) {
      console.error('Error cargando historial:', err);
    }
  };

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    const currentQuestion = question;
    setQuestion('');

    try {
      const result = await askQuestion(documentId, currentQuestion);
      setHistory((prev) => [...prev, result]);
    } catch (err) {
      setError('Error al preguntar: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleAsk();
    }
  };

  if (!documentId) {
    return (
      <div className="chat-panel">
        <div className="chat-placeholder">
          <div className="chat-placeholder-icon">📄</div>
          <p>Selecciona un documento de la lista<br />para empezar a hacerle preguntas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-panel">
      <p className="chat-doc-title">{documentName}</p>

      <div className="chat-history">
        {history.map((item, index) => (
          <div key={item.id || index} className="chat-turn">
            <p className="chat-q">
              <span className="chat-q-tag">Tú</span>
              {item.question}
            </p>
            <p className="chat-a">{item.answer}</p>
          </div>
        ))}

        {loading && (
          <div className="thinking">
            <span></span><span></span><span></span>
          </div>
        )}

        <div ref={historyEndRef} />
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta, en cualquier idioma…"
          disabled={loading}
        />
        <button className="btn" onClick={handleAsk} disabled={loading || !question.trim()}>
          {loading ? '…' : 'Preguntar'}
        </button>
      </div>

      {error && <p className="error-msg">{error}</p>}
    </div>
  );
}

export default ChatBox;