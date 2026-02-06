import * as admin from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

if (serviceAccount && !admin.apps.length) {
  try {
    const credentials = JSON.parse(
      Buffer.from(serviceAccount, 'base64').toString('utf-8')
    );
    admin.initializeApp({
      credential: admin.credential.cert(credentials),
    });
  } catch {
    admin.initializeApp();
  }
} else if (!admin.apps.length) {
  admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();

export default admin;
