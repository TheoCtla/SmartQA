import axios from 'axios';

// Si l'application est en mode production (déployée), on utilise Render.
// Sinon, on utilise le localhost pour le développement.
const API_URL = import.meta.env.PROD
    ? 'https://smartqa-backend.onrender.com'
    : 'http://localhost:3001';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Export de l'URL pour les EventSource (SSE)
export const getApiUrl = () => API_URL;

export default api;
