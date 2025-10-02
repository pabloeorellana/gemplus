import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';

// --- IMPORTACIÓN DE RUTAS ---
import userRoutes from './routes/userRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import clinicalRecordRoutes from './routes/clinicalRecordRoutes.js';
import statisticsRoutes from './routes/statisticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authRoutes from './routes/authRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import practiceLocationRoutes from './routes/practiceLocationRoutes.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET;

// Configuración de __dirname para ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Verificación de variables de entorno críticas al inicio
if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET no está definida en .env");
    process.exit(1);
}

// Configuración de CORS
const allowedOrigins = [
    'http://localhost:5173',
    'http://gemplus.com.ar',
    'https://gemplus.com.ar',
    'http://www.gemplus.com.ar',
    'https://www.gemplus.com.ar',
    process.env.FRONTEND_URL
].filter(Boolean);

console.log("Orígenes permitidos por CORS:", allowedOrigins);

// <-- INICIO DE LA CORRECCIÓN DE CORS -->
// Se unifica toda la configuración de CORS en un solo middleware.
// Esto maneja correctamente las peticiones normales y las 'preflight' (OPTIONS).
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`CORS Error: Origen no permitido: ${origin}`);
      callback(new Error('No permitido por CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));
// <-- FIN DE LA CORRECCIÓN DE CORS -->

// Middlewares globales
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware para servir archivos estáticos de la carpeta 'uploads'
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
// Middleware para servir archivos del almacenamiento persistente de forma dinámica
const storageBasePath = process.env.STORAGE_PATH || '/data';
const attachmentsPath = path.join(storageBasePath, 'clinical_attachments');
app.use('/storage', express.static(attachmentsPath));

// --- Montaje de Rutas de la API con Prefijos ---
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinical-records', clinicalRecordRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/catalogs', catalogRoutes);
app.use('/api/locations', practiceLocationRoutes);

// Ruta de "health check" para verificar que el servidor está vivo
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor GEM Plus está funcionando!' });
});

// --- Manejador de Errores Global ---
app.use((err, req, res, next) => {
    console.error('--- ERROR GLOBAL CAPTURADO ---');
    console.error('Mensaje:', err.message);
    console.error('Stack:', err.stack);
    console.error('-----------------------------');
    
    if (res.headersSent) {
      return next(err);
    }
    
    res.status(500).json({
        message: err.message || 'Ha ocurrido un error inesperado en el servidor.',
        stack: process.env.NODE_ENV === 'production' ? '🥞' : err.stack,
    });
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor backend GEM Plus corriendo en el puerto: ${PORT}`);
});