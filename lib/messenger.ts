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
   * You can generate a conversationId using push, or just let Firestore create a random ID.
   */
  export async function createConversation(participants: string[]): Promise<string> {
    // Option A: Let Firestore generate an ID
    const convRef = doc(collection(db, 'conversations'));
    const conversationId = convRef.id;
  
    // Set the conversation doc
    await setDoc(convRef, {
      participants,
      createdAt: serverTimestamp(),
      // Optionally store lastMessage, conversation name, etc.
    });
  
    return conversationId;
  }
  
  /**
   * Send a message to a conversation.
   */
  export async function sendMessage(conversationId: string, senderId: string, text: string) {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(messagesRef, {
      text,
      senderId,
      createdAt: serverTimestamp(),
    });
  
    // Optional: update lastMessage in the conversation doc
    const conversationRef = doc(db, 'conversations', conversationId);
    await setDoc(conversationRef, {
      lastMessage: {
        text,
        senderId,
        createdAt: serverTimestamp(),
      },
    }, { merge: true });
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
  
    // onSnapshot returns an unsubscribe function
    const unsubscribe = onSnapshot(q, snapshot => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      callback(messages);
    });
  
    return unsubscribe;
  }
  
  /**
   * Optionally: retrieve conversation info (participants, etc.)
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
  