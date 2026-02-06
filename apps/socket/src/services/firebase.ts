import * as admin from 'firebase-admin';
import { Message, FIREBASE_COLLECTIONS } from '@skipli/shared';

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

const db = admin.firestore();

export async function saveMessage(roomId: string, message: Message): Promise<void> {
  await db
    .collection(FIREBASE_COLLECTIONS.CHAT_ROOMS)
    .doc(roomId)
    .collection(FIREBASE_COLLECTIONS.MESSAGES)
    .doc(message.id)
    .set({
      ...message,
      timestamp: admin.firestore.Timestamp.fromDate(message.timestamp),
    });

  await db.collection(FIREBASE_COLLECTIONS.CHAT_ROOMS).doc(roomId).set(
    {
      lastMessage: message,
      updatedAt: new Date(),
    },
    { merge: true }
  );
}

export async function getMessages(roomId: string): Promise<Message[]> {
  const messagesSnapshot = await db
    .collection(FIREBASE_COLLECTIONS.CHAT_ROOMS)
    .doc(roomId)
    .collection(FIREBASE_COLLECTIONS.MESSAGES)
    .get();

  return messagesSnapshot.docs
    .map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        ...data,
        timestamp: data.timestamp?.toDate() || new Date(),
      } as Message;
    })
    .sort((a: Message, b: Message) => a.timestamp.getTime() - b.timestamp.getTime());
}

export async function markMessagesAsRead(
  roomId: string,
  userId: string
): Promise<void> {
  const messagesSnapshot = await db
    .collection(FIREBASE_COLLECTIONS.CHAT_ROOMS)
    .doc(roomId)
    .collection(FIREBASE_COLLECTIONS.MESSAGES)
    .where('receiverId', '==', userId)
    .where('read', '==', false)
    .get();

  const batch = db.batch();
  messagesSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { read: true });
  });

  await batch.commit();
}
