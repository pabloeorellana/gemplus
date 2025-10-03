import express from 'express';
import {
    getAllSpecialties, createSpecialty, updateSpecialty, deleteSpecialty,
    getPathologies, createPathology, updatePathology, deletePathology,
    getPrefixes, createPrefix, updatePrefix, deletePrefix, getPathologiesBySpecialty
} from '../controllers/catalogController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.get('/specialties', authorize('ADMIN', 'PROFESSIONAL'), getAllSpecialties);
router.get('/pathologies', getPathologies);
router.get('/pathologies/by-specialty', getPathologiesBySpecialty);
router.get('/prefixes', getPrefixes);

router.post('/specialties', authorize('ADMIN'), createSpecialty);
router.put('/specialties/:id', authorize('ADMIN'), updateSpecialty);
router.delete('/specialties/:id', authorize('ADMIN'), deleteSpecialty);

router.post('/pathologies', authorize('ADMIN'), createPathology);
router.put('/pathologies/:id', authorize('ADMIN'), updatePathology);
router.delete('/pathologies/:id', authorize('ADMIN'), deletePathology);

router.post('/prefixes', authorize('ADMIN'), createPrefix);
router.put('/prefixes/:id', authorize('ADMIN'), updatePrefix);
router.delete('/prefixes/:id', authorize('ADMIN'), deletePrefix);

export default router;