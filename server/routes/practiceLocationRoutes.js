import express from 'express';
import {
    getLocations,
    addLocation,
    updateLocation,
    deleteLocation
} from '../controllers/practiceLocationController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Todas las rutas aquí requieren que el usuario sea un profesional logueado
router.use(protect, authorize('PROFESSIONAL'));

router.route('/')
    .get(getLocations)
    .post(addLocation);

router.route('/:locationId')
    .put(updateLocation)
    .delete(deleteLocation);

export default router;