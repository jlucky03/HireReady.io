import express from 'express';
import { firebaseLogin, protect } from '../controllers/authController.js';

const router = express.Router();

router.post('/firebase-login', firebaseLogin);

router.get('/me', protect, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      photoURL: req.user.photoURL,
      credits: req.user.credits,
      role: req.user.role,
    },
  });
});

export default router;