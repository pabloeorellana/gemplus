import express from 'express';
import { 
    getAllUsers, createUser, getUserById, updateUser, toggleUserStatus, resetUserPassword,
    deletePatientPermanently, deleteUserPermanently, assignManualSubscription, getAllPlansForAdmin, updateSubscriptionStatus, getAllSubscriptions
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/plans', getAllPlansForAdmin);
router.get('/subscriptions', getAllSubscriptions);
router.patch('/subscriptions/:subscriptionId/status', updateSubscriptionStatus);

router.route('/users')
    .get(getAllUsers)
    .post(createUser);

router.route('/users/:id')
    .get(getUserById)
    .put(updateUser)
    .patch(toggleUserStatus)
    .delete(deleteUserPermanently);

router.route('/users/:id/reset-password')
    .put(resetUserPassword);

router.route('/users/:userId/subscription')
    .post(assignManualSubscription);
    
router.route('/patients/:id')
    .delete(deletePatientPermanently); 

export default router;