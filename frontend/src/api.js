import axios from 'axios';

const API_URL = 'http://localhost:8000';

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await axios.post(`${API_URL}/documents/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
};

export const askQuestion = async (documentId, question) => {
    const response = await axios.post(
        `${API_URL}/documents/${documentId}/ask`,
        null,
        { params: { question } }
    );
    return response.data;
};

export const getDocuments = async () => {
    const response = await axios.get(`${API_URL}/documents`);
    return response.data;
};

export const getHistory = async (documentId) => {
    const response = await axios.get(`${API_URL}/documents/${documentId}/history`);
    return response.data;
};

export const deleteDocument = async (documentId) => {
  const response = await axios.delete(`${API_URL}/documents/${documentId}`);
  return response.data;
};