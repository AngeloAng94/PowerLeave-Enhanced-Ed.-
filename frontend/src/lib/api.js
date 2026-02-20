const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const api = {
  async fetch(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    };

    try {
      const response = await window.fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.hash = '#/login';
        throw new Error('Non autenticato');
      }

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Errore del server' }));
        throw new Error(error.detail || 'Errore del server');
      }

      return await response.json();
    } catch (error) {
      if (error.message === 'Non autenticato') throw error;
      throw error;
    }
  },

  get: (endpoint) => api.fetch(endpoint),
  post: (endpoint, data) => api.fetch(endpoint, { method: 'POST', body: JSON.stringify(data) }),
  put: (endpoint, data) => api.fetch(endpoint, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (endpoint) => api.fetch(endpoint, { method: 'DELETE' }),
};

export default api;
export { API_URL };
