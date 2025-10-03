let apiUrl;

// La variable import.meta.env.PROD es inyectada por Vite durante el build.
if (import.meta.env.PROD) {
  // En producción, la URL base es simplemente /api. 
  // El navegador completará el dominio automáticamente (ej: https://www.gemplus.com.ar/api).
  apiUrl = '/api'; 
} else {
  // En desarrollo, apuntamos directamente al servidor de backend en localhost.
  apiUrl = 'http://localhost:3001/api';
}

export const API_BASE_URL = apiUrl;