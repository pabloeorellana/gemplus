import { API_BASE_URL } from '../config';

const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

const authFetch = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    // Con la nueva configuración de `config.js`, la URL se construye de forma simple y directa.
    // Ej en Prod: API_BASE_URL ('/api') + endpoint ('/users/me') = '/api/users/me'
    // Ej en Dev: API_BASE_URL ('http://.../api') + endpoint ('/users/me') = 'http://.../api/users/me'
    const url = `${API_BASE_URL}${endpoint}`;

    const isFormData = options.body instanceof FormData;

    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    if (isFormData) {
        delete headers['Content-Type'];
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        if (response.status === 401) {
            console.error("authFetch: No autorizado o token expirado. Redirigiendo a login.");
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            sessionStorage.removeItem('authToken');
            sessionStorage.removeItem('userData');
            window.location.href = '/profesional/login';
            throw new Error('No autorizado');
        }

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch (e) {
                // Si la respuesta de error no es JSON (como una página 404 de HTML), usamos el statusText.
                errorData = { message: response.statusText || `Error del servidor ${response.status}` };
            }
            throw new Error(errorData.message || `Error ${response.status}`);
        }

        if (response.status === 204) {
            return null;
        }
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            return response.json();
        } else {
            return response;
        }

    } catch (error) {
        console.error(`Error en authFetch para ${url}:`, error);
        throw error;
    }
};

export default authFetch;