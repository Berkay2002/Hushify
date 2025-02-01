// lib/messenger.ts

import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebaseConfig';

/**
 * Create (or return) a conversation doc for these participants.
 * You can generate a conversationId using push, or let Firestore generate a random ID.
 */
export async function createConversation(participants: string[]): Promise<string> {
  // Let Firestore generate an ID.
  const convRef = doc(collection(db, 'conversations'));
  const conversationId = convRef.id;

  // Set the conversation document.
  await setDoc(convRef, {
    participants,
    createdAt: serverTimestamp(),
    // Optionally store lastMessage, conversation name, etc.
  });

  return conversationId;
}

/**
 * Send a message to a conversation.
 * @param conversationId - The conversation's ID.
 * @param senderId - The UID of the sender.
 * @param text - The text of the message.
 * @param extraData - Optional extra data (e.g. file metadata).
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  extraData?: object
) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const messageData = {
    text,
    senderId,
    createdAt: serverTimestamp(),
    ...extraData, // Merge any extra data (e.g. fileUrl, fileName, fileType)
  };
  await addDoc(messagesRef, messageData);

  // Optionally, update the conversation doc with the last message.
  const conversationRef = doc(db, 'conversations', conversationId);
  await setDoc(
    conversationRef,
    {
      lastMessage: {
        text,
        senderId,
        createdAt: serverTimestamp(),
      },
    },
    { merge: true }
  );
}

/**
 * Subscribe to messages in real-time.
 * The callback receives an array of messages ordered by createdAt.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: DocumentData[]) => void
) {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'));

  // onSnapshot returns an unsubscribe function.
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(messages);
  });

  return unsubscribe;
}

/**
 * Optionally: Retrieve conversation info (participants, etc.).
 */
export async function getConversation(conversationId: string) {
  const docRef = doc(db, 'conversations', conversationId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return {
    id: snap.id,
    ...snap.data(),
  };
}
