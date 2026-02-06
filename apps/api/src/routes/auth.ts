import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../services/firebase';
import { sendAccessCodeEmail } from '../services/email';
import { generateToken } from '../middleware/auth';
import {
  generateAccessCode,
  getAccessCodeExpiry,
  isAccessCodeExpired,
  isValidEmail,
  FIREBASE_COLLECTIONS,
  USER_ROLES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from '@skipli/shared';
const router: Router = Router();

router.post('/loginWithPassword', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.EMAIL_PASSWORD_REQUIRED });
    }

    const normalizedEmail = email.toLowerCase();
    const userQuery = await db.collection(FIREBASE_COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({ success: false, error: ERROR_MESSAGES.USER_NOT_FOUND });
    }

    const userData = userQuery.docs[0].data();

    if (!userData.password) {
       return res.status(400).json({ success: false, error: ERROR_MESSAGES.PASSWORD_NOT_SET });
    }

    const isMatch = await bcrypt.compare(password, userData.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.INVALID_PASSWORD });
    }

    const token = generateToken({
      id: userData.id,
      email: userData.email,
      role: userData.role,
    });

    res.json({ success: true, userType: userData.role, user: userData, token });
  } catch (err) {
    console.error('loginWithPassword error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});
router.post('/login', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.INVALID_EMAIL });
    }
    const normalizedEmail = email.toLowerCase();
    const code = generateAccessCode();
    const expiresAt = getAccessCodeExpiry();
    await db.collection(FIREBASE_COLLECTIONS.ACCESS_CODES).doc(normalizedEmail).set({
      code,
      email: normalizedEmail,
      createdAt: new Date(),
      expiresAt,
    });
    const bypassEmail = process.env.BYPASS_EMAIL_VERIFY === 'true';
    if (bypassEmail) {
       const defaultCode = process.env.DEFAULT_OTP_CODE || code;
       await db.collection(FIREBASE_COLLECTIONS.ACCESS_CODES).doc(normalizedEmail).update({
         code: defaultCode
       });
       console.log(`[DEV MODE] Access code for ${normalizedEmail}: ${defaultCode}`);
       return res.json({ 
         success: true, 
         message: SUCCESS_MESSAGES.EMAIL_BYPASSED, 
         accessCode: defaultCode 
       });
    }
    const sent = await sendAccessCodeEmail(normalizedEmail, code);
    if (!sent) {
      return res.status(500).json({ success: false, error: ERROR_MESSAGES.EMAIL_SEND_FAILED });
    }
    res.json({ success: true, message: SUCCESS_MESSAGES.ACCESS_CODE_SENT });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});
router.post('/verify', async (req, res) => {
  try {
    const { email, accessCode } = req.body;
    if (!email || !accessCode) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.EMAIL_ACCESS_CODE_REQUIRED });
    }
    const normalizedEmail = email.toLowerCase();
    const codeDoc = await db.collection(FIREBASE_COLLECTIONS.ACCESS_CODES).doc(normalizedEmail).get();
    if (!codeDoc.exists) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.ACCESS_CODE_NOT_FOUND });
    }
    const stored = codeDoc.data();
    if (!stored || stored.code !== accessCode) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.INVALID_ACCESS_CODE });
    }
    if (isAccessCodeExpired(stored.expiresAt.toDate())) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.ACCESS_CODE_EXPIRED });
    }
    await db.collection(FIREBASE_COLLECTIONS.ACCESS_CODES).doc(normalizedEmail).delete();
    let userQuery = await db.collection(FIREBASE_COLLECTIONS.USERS)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();
    let userData: any = null;
    let userType = 'instructor'; 
    if (!userQuery.empty) {
      const userDoc = userQuery.docs[0];
      userData = userDoc.data();
      userType = userData.role;
      if (userType === USER_ROLES.STUDENT) {
        if (!userData.instructorEmail && userData.instructorId) {
          const instructorDoc = await db.collection(FIREBASE_COLLECTIONS.USERS).doc(userData.instructorId).get();
          if (instructorDoc.exists) {
            const instructorData = instructorDoc.data();
            if (instructorData?.email) {
              userData.instructorEmail = instructorData.email;
              await userDoc.ref.update({ instructorEmail: instructorData.email });
            }
          }
        }
      }
    } else {
      const newId = normalizedEmail; 
      userData = {
        id: newId,
        email: normalizedEmail,
        name: 'Instructor',
        role: 'instructor',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await db.collection(FIREBASE_COLLECTIONS.USERS).doc(newId).set(userData);
    }
    const token = generateToken({
      id: userData.id,
      email: userData.email,
      role: userData.role,
    });
    res.json({ success: true, userType: userData.role, user: userData, token });
  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});
router.post('/setupAccount', async (req, res) => {
  try {
    const { id, password } = req.body;
    if (!id || !password) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.ID_PASSWORD_REQUIRED });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.PASSWORD_TOO_SHORT });
    }
    const userDoc = await db.collection(FIREBASE_COLLECTIONS.USERS).doc(id).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, error: ERROR_MESSAGES.USER_NOT_FOUND });
    }
    const userData = userDoc.data();
    if (userData?.isAccountSetup) {
      return res.status(400).json({ success: false, error: ERROR_MESSAGES.ACCOUNT_ALREADY_SETUP });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    await userDoc.ref.update({
      isAccountSetup: true,
      password: hashedPassword,
      updatedAt: new Date(),
    });
    res.json({ success: true, message: SUCCESS_MESSAGES.ACCOUNT_SETUP_SUCCESS });
  } catch (err) {
    console.error('setupAccount error:', err);
    res.status(500).json({ success: false, error: ERROR_MESSAGES.ERROR_GENERIC });
  }
});
export default router;
