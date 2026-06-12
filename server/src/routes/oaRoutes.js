import { Router } from 'express';
import { startOaExam, finalizeOaExam, saveOaProgress } from '../controllers/oaController.js';
import { protect } from '../controllers/authController.js';

const router = Router();

router.post('/start', protect, startOaExam);
router.post('/save-progress', protect, saveOaProgress); 
router.post('/finalize', protect, finalizeOaExam);

export default router;