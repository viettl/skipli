import { Router, Response } from 'express';
import { db } from '../services/firebase';
import { sendStudentInvitation } from '../services/email';
import { authenticate, requireInstructor, AuthRequest } from '../middleware/auth';
import {
  isValidEmail, isValidName,
  sanitizeString, generateId,
  FIREBASE_COLLECTIONS, USER_ROLES, ERROR_MESSAGES, SUCCESS_MESSAGES,
} from '@skipli/shared';

const router: Router = Router();

router.use(authenticate, requireInstructor);

router.post('/addStudent', async (req: AuthRequest, res: Response) => {
  try {
    const { name, email } = req.body;
    if (!name || !isValidName(name)) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.NAME_REQUIRED });
    }
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.EMAIL_REQUIRED });
    }
    const normalizedEmail = email.toLowerCase();
    
    // check if student  exists
    const existing = await db.collection(FIREBASE_COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail).limit(1).get();
    if (!existing.empty) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.STUDENT_EXISTS });
    }
    const id = generateId();
    const studentData = {
      id,
      name: sanitizeString(name),
      email: normalizedEmail,
      role: USER_ROLES.STUDENT,
      instructorId: req.user?.id,
      instructorEmail: req.user?.email,
      isAccountSetup: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    await db.collection(FIREBASE_COLLECTIONS.USERS).doc(id).set(studentData);
    
    // send invitation email
    const setupLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173'}/setup-account?id=${id}`;
    await sendStudentInvitation(normalizedEmail, name, setupLink);
    res.json({ success: true, message: SUCCESS_MESSAGES.STUDENT_ADDED, student: studentData });
  } catch (err) {
    console.error('addStudent error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});

router.post('/assignLesson', async (req: AuthRequest, res: Response) => {
  try {
    const { studentEmail, title, description } = req.body;
    if (!studentEmail) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.STUDENT_EMAIL_REQUIRED });
    }
    if (!isValidEmail(studentEmail)) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.VALID_STUDENT_EMAIL_REQUIRED });
    }
    const normalizedStudentEmail = studentEmail.toLowerCase();
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.LESSON_TITLE_REQUIRED });
    }
    const studentQuery = await db.collection(FIREBASE_COLLECTIONS.USERS)
      .where('email', '==', normalizedStudentEmail)
      .where('role', '==', USER_ROLES.STUDENT)
      .limit(1).get();
    if (studentQuery.empty) {
      return res.status(404).json({ success: false, error: ERROR_MESSAGES.STUDENT_NOT_FOUND });
    }
    const lessonId = generateId();
    const lessonData = {
      id: lessonId,
      title: sanitizeString(title),
      description: sanitizeString(description || ''),
      studentEmail: normalizedStudentEmail,
      instructorId: req.user?.id,
      status: 'assigned',
      assignedAt: new Date(),
      completedAt: null,
    };
    
    await db.collection(FIREBASE_COLLECTIONS.LESSONS).doc(lessonId).set(lessonData);
    res.json({ success: true, message: SUCCESS_MESSAGES.LESSON_ASSIGNED, lesson: lessonData });
  } catch (err) {
    console.error('assignLesson error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});

router.get('/students', async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db.collection(FIREBASE_COLLECTIONS.USERS)
      .where('role', '==', USER_ROLES.STUDENT)
      .where('instructorId', '==', req.user?.id)
      .get();
    const studentsData = snapshot.docs.map(doc => doc.data());
    
    const studentsWithLessonCount = await Promise.all(
      studentsData.map(async (student: any) => {
        const lessonsSnap = await db.collection(FIREBASE_COLLECTIONS.LESSONS)
          .where('studentEmail', '==', student.email)
          .get();
        
        const lessons = lessonsSnap.docs.map(doc => doc.data());
        
        // count lessons by status
        const inProgressCount = lessons.filter((lesson: any) => 
          lesson.status === 'assigned' || lesson.status === 'in_progress'
        ).length;
        const completedCount = lessons.filter((lesson: any) => 
          lesson.status === 'completed'
        ).length;
        
        return {
          ...student,
          lessonCount: lessonsSnap.size,
          inProgressCount,
          completedCount,
        };
      })
    );
    
    const students = studentsWithLessonCount.sort((a: any, b: any) => {
      const dateA = a.createdAt?._seconds || 0;
      const dateB = b.createdAt?._seconds || 0;
      return dateB - dateA;
    });
    
    res.json({ success: true, students });
  } catch (err) {
    console.error('getStudents error:', err);
    res.status(500).json({ success: false, error: (err as Error).message || ERROR_MESSAGES.ERROR_GENERIC });
  }
});

router.get('/student/:email', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase();
    const studentQuery = await db.collection(FIREBASE_COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail)
      .where('instructorId', '==', req.user?.id)
      .limit(1).get();
    if (studentQuery.empty) {
      return res.status(404).json({ success: false, error: ERROR_MESSAGES.STUDENT_NOT_FOUND });
    }
    const student = studentQuery.docs[0].data();
    const lessonsSnap = await db.collection(FIREBASE_COLLECTIONS.LESSONS)
      .where('studentEmail', '==', normalizedEmail)
      .get();
    const lessons = lessonsSnap.docs
      .map(doc => doc.data())
      .sort((a, b) => {
        const dateA = a.assignedAt?._seconds || 0;
        const dateB = b.assignedAt?._seconds || 0;
        return dateB - dateA;
      });
    res.json({ success: true, student, lessons });
  } catch (err) {
    console.error('getStudent error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});
router.put('/editStudent/:email', async (req: AuthRequest, res: Response) => {
  try {
    const { email: paramEmail } = req.params;
    const normalizedParamEmail = paramEmail.toLowerCase();
    const { name, email } = req.body;
    const query = await db.collection(FIREBASE_COLLECTIONS.USERS)
      .where('email', '==', normalizedParamEmail)
      .where('instructorId', '==', req.user?.id)
      .limit(1).get();
    if (query.empty) {
      return res.status(404).json({ success: false, error: ERROR_MESSAGES.STUDENT_NOT_FOUND });
    }
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name && isValidName(name)) updates.name = sanitizeString(name);
    if (email && isValidEmail(email)) updates.email = email.toLowerCase();
    await query.docs[0].ref.update(updates);
    res.json({ success: true, message: SUCCESS_MESSAGES.UPDATE_SUCCESS });
  } catch (err) {
    console.error('editStudent error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});
router.delete('/student/:email', async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase();
    const query = await db.collection(FIREBASE_COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail)
      .where('instructorId', '==', req.user?.id)
      .limit(1).get();
    if (query.empty) {
      return res.status(404).json({ success: false, error: ERROR_MESSAGES.STUDENT_NOT_FOUND });
    }
    await query.docs[0].ref.delete();
    const lessonsSnap = await db.collection(FIREBASE_COLLECTIONS.LESSONS)
      .where('studentEmail', '==', normalizedEmail).get();
    const batch = db.batch();
    lessonsSnap.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    res.json({ success: true, message: SUCCESS_MESSAGES.DELETE_SUCCESS });
  } catch (err) {
    console.error('deleteStudent error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});
export default router;
