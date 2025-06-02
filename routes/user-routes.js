import express from 'express';
import { protectRoute } from '../middleware/auth.js';
import { getProfile } from '../controllers/userController.js';
const router = express.Router();

router.get('/profile' , protectRoute , getProfile)

export default router;