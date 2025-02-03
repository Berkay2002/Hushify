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
  limit,
  startAfter,
  QueryDocumentSnapshot
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// === 🔐 Encryption Setup Using Web Crypto API ===

// Convert ArrayBuffer to Base64
const bufferToBase64 = (buffer: ArrayBuffer): string =>
  btoa(String.fromCharCode(...new Uint8Array(buffer)));

// Convert Base64 to ArrayBuffer
const base64ToBuffer = (base64: string): ArrayBuffer =>
  Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;

// 🔑 **Using One Secure Key (Consider Storing Securely)**
const MASTER_SECRET = process.env.NEXT_PUBLIC_MASTER_SECRET;

// 🔹 **Generate Encryption Key using HKDF (Optimized for Speed)**
let cachedEncryptionKey: CryptoKey | null = null;

export const getEncryptionKey = async (): Promise<CryptoKey> => {
  if (cachedEncryptionKey) return cachedEncryptionKey;

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(MASTER_SECRET),
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  cachedEncryptionKey = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: encoder.encode("chat-secure-salt"),
      info: encoder.encode("messenger-key"),
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  return cachedEncryptionKey;
};

// 🔹 **Encrypt Message Using AES-256-GCM**
export const encryptMessage = async (
  plainText: string,
  key: CryptoKey
): Promise<{ cipherText: string; iv: string }> => {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  );
  return {
    cipherText: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
};

// 🔹 **Decrypt Message Using AES-256-GCM**
export const decryptMessage = async (
  cipherText: string,
  ivBase64: string,
  key: CryptoKey
): Promise<string> => {
  try {
    const decoder = new TextDecoder();
    const iv = new Uint8Array(base64ToBuffer(ivBase64));
    const cipherBuffer = base64ToBuffer(cipherText);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherBuffer
    );
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("❌ Decryption failed:", error);
    return "**[Message cannot be decrypted]**";
  }
};

// === 📩 Firestore Messenger Functions ===

export const createConversation = async (participants: string[]): Promise<string> => {
  const convRef = doc(collection(db, "conversations"));
  await setDoc(convRef, {
    participants,
    createdAt: serverTimestamp(),
  });
  return convRef.id;
};

export const sendMessage = async (
  conversationId: string,
  senderId: string,
  text: string,
  extraData?: object
): Promise<void> => {
  const key = await getEncryptionKey();
  const { cipherText, iv } = await encryptMessage(text, key);
  const messagesRef = collection(db, "conversations", conversationId, "messages");

  const messageData = {
    text: cipherText,
    iv,
    senderId,
    createdAt: serverTimestamp(),
    ...extraData,
  };

  await addDoc(messagesRef, messageData);
};

export const subscribeToMessages = (
  conversationId: string,
  lastVisibleMessage: QueryDocumentSnapshot<DocumentData> | null,
  callback: (messages: DocumentData[], lastDoc: QueryDocumentSnapshot<DocumentData> | null) => void
) => {
  const messagesRef = collection(db, "conversations", conversationId, "messages");

  let q = query(messagesRef, orderBy("createdAt", "desc"), limit(20));
  if (lastVisibleMessage) {
    q = query(messagesRef, orderBy("createdAt", "desc"), startAfter(lastVisibleMessage), limit(20));
  }

  const keyPromise = getEncryptionKey();

  return onSnapshot(q, async (snapshot) => {
    const key = await keyPromise;
    const lastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

    const messages = await Promise.all(snapshot.docs.map(async (doc) => {
      const data = doc.data();
      data.text = await decryptMessage(data.text, data.iv, key);
      return { id: doc.id, ...data };
    }));

    callback(messages, lastDoc);
  });
};


export const getConversation = async (conversationId: string) => {
  const docRef = doc(db, "conversations", conversationId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};
