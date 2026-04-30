import express from 'express';
import {
  changePassword,
  createUser,
  deleteUser,
  forgotPassword,
  logout,
  getUser,
  authenticate,
} from '../controllers/user.controller';

// Middleware
const router = express.Router();

router.post('/create', createUser);
router.post('/delete', deleteUser);
router.post('/change-password', changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/profile', getUser);
router.post('/authenticate', authenticate);
router.post('/logout', logout);

export default router;
