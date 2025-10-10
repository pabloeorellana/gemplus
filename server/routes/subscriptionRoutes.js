import express from 'express';
import { getPlans, createSubscription, handleWebhook, getMySubscriptionStatus } from '../controllers/subscriptionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Rutas públicas (para el webhook)
router.post('/webhook', handleWebhook);

// Rutas protegidas
router.get('/plans', protect, getPlans);
router.get('/my-status', protect, getMySubscriptionStatus);
router.post('/create', protect, createSubscription);

export default router;