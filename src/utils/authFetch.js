import { API_BASE_URL } from '../config';

const getAuthToken = () => {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

const authFetch = async (endpoint, options = {}) => {
    const token = getAuthToken();
    
    // <-- INICIO DE LA CORRECCIÓN CRÍTICA Y DEFINITIVA -->
    // Esta lógica asegura que no haya duplicación de "/api".
    // Si el endpoint que nos pasan ya empieza con /api, no hacemos nada.
    // Si no empieza con /api, le añadimos la URL base.
    const finalEndpoint = endpoint.startsWith('/api/') ? endpoint.substring(4) : endpoint;
    const url = `${API_BASE_URL}${finalEndpoint}`;
    // <-- FIN DE LA CORRECCIÓN CRÍTICA Y DEFINITIVA -->

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