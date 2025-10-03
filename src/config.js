let apiUrl;

// La variable import.meta.env.PROD es inyectada por Vite durante el build.
if (import.meta.env.PROD) {
  // En producción, usamos una URL absoluta para evitar cualquier problema con rutas relativas.
  // El navegador sabrá exactamente a qué dominio y ruta apuntar.
  apiUrl = 'https://www.gemplus.com.ar/api'; 
} else {
  // En desarrollo, apuntamos directamente al servidor de backend en localhost.
  apiUrl = 'http://localhost:3001/api';
}

export const API_BASE_URL = apiUrl;