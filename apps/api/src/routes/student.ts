import { Router, Response } from 'express';
import { db } from '../services/firebase';
import { authenticate, requireStudent, AuthRequest } from '../middleware/auth';
import {
  isValidEmail, isValidName, sanitizeString,
  FIREBASE_COLLECTIONS, LESSON_STATUS, ERROR_MESSAGES, SUCCESS_MESSAGES,
} from '@skipli/shared';

const router: Router = Router();

const studentAuth = [authenticate, requireStudent];
  
router.get('/myLessons', studentAuth, async (req: AuthRequest, res: Response) => {
  try {
    const email = req.user?.email;
    if (!email) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED });
    }
    const normalizedEmail = email.toLowerCase();

    const snap = await db.collection(FIREBASE_COLLECTIONS.LESSONS)
      .where('studentEmail', '==', normalizedEmail)
      .get();

    const lessons = snap.docs
      .map(d => d.data())
      .sort((a, b) => {
        const dateA = a.assignedAt?._seconds || 0;
        const dateB = b.assignedAt?._seconds || 0;
        return dateB - dateA;
      });

    res.json({ success: true, lessons });
  } catch (err) {
    console.error('getMyLessons error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});

router.post('/markLessonDone', studentAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { lessonId } = req.body;
    const email = req.user?.email;
    if (!email) return res.status(401).json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED });
    const normalizedEmail = email.toLowerCase();

    if (!lessonId) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.LESSON_ID_REQUIRED });
    }

    const doc = await db.collection(FIREBASE_COLLECTIONS.LESSONS).doc(lessonId).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, error: ERROR_MESSAGES.LESSON_NOT_FOUND });
    }

    const data = doc.data();
    if (data?.studentEmail !== normalizedEmail) {
      return res.status(403).json({ success: false, error: ERROR_MESSAGES.UNAUTHORIZED_LESSON });
    }

    await doc.ref.update({
      status: LESSON_STATUS.COMPLETED,
      completedAt: new Date(),
    });

    res.json({ success: true, message: SUCCESS_MESSAGES.LESSON_COMPLETED });
  } catch (err) {
    console.error('markLessonDone error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});

router.put('/editProfile', studentAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.NOT_AUTHENTICATED });
    }

    const docRef = db.collection(FIREBASE_COLLECTIONS.USERS).doc(userId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, error: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (name) {
      if (!isValidName(name)) {
        return res.status(400).json({ success: false, error: ERROR_MESSAGES.INVALID_NAME_FORMAT });
      }
      updates.name = sanitizeString(name);
    }

    if (email) {
      if (!isValidEmail(email)) {
        return res.status(400).json({ success: false, error: ERROR_MESSAGES.INVALID_EMAIL_FORMAT });
      }
      updates.email = email.toLowerCase();
    }

    await docRef.update(updates);

    const updated = await docRef.get();
    res.json({ success: true, message: SUCCESS_MESSAGES.PROFILE_UPDATED, user: updated.data() });
  } catch (err) {
    console.error('editProfile error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});

export default router;
