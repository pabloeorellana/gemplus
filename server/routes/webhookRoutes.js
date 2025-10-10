import express from 'express';
import { handleWebhook } from '../controllers/subscriptionController.js';

const router = express.Router();

router.post('/webhook', express.json(), handleWebhook);

export default router;
