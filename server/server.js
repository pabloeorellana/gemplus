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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET no está definida en .env");
    process.exit(1);
}

const allowedOrigins = [
    'http://localhost:5173',
    'http://gemplus.com.ar',
    'https://gemplus.com.ar',
    'http://www.gemplus.com.ar',
    'https://www.gemplus.com.ar',
    process.env.FRONTEND_URL
].filter(Boolean);

console.log("Orígenes permitidos por CORS:", allowedOrigins);

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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
const storageBasePath = process.env.STORAGE_PATH || '/data';
const attachmentsPath = path.join(storageBasePath, 'clinical_attachments');
app.use('/storage', express.static(attachmentsPath));

// --- INICIO DE LA MODIFICACIÓN: APLICAR PREFIJO GLOBAL ---
// Creamos un router principal para la API
const apiRouter = express.Router();

// Montamos todas las rutas de la API bajo este router principal
apiRouter.use('/public', publicRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', userRoutes);
apiRouter.use('/availability', availabilityRoutes);
apiRouter.use('/patients', patientRoutes);
apiRouter.use('/appointments', appointmentRoutes);
apiRouter.use('/clinical-records', clinicalRecordRoutes);
apiRouter.use('/statistics', statisticsRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/catalogs', catalogRoutes);
apiRouter.use('/locations', practiceLocationRoutes);

// Ruta de "health check"
apiRouter.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Servidor GEM Plus está funcionando!' });
});

// Montamos el router principal en el prefijo /api
app.use('/api', apiRouter);
// --- FIN DE LA MODIFICACIÓN ---


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

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor backend GEM Plus corriendo en el puerto: ${PORT}`);
});