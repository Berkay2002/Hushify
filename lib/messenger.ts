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
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// === 🔐 Encryption Setup Using Web Crypto API ===

// Convert ArrayBuffer to Base64
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

// Convert Base64 to ArrayBuffer
function base64ToBuffer(base64: string): ArrayBuffer {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0)).buffer;
}

// 🔑 **Using One Secure Key**
const MASTER_SECRET = "your-secure-master-key"; // Store this securely

// 🔹 **Generate Encryption Key using HKDF (Optimized for Speed)**
export async function getEncryptionKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(MASTER_SECRET),
    { name: "HKDF" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
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
}

// 🔹 **Encrypt Message Using AES-256-GCM**
export async function encryptMessage(plainText: string, key: CryptoKey): Promise<{ cipherText: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for security
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plainText)
  );
  return {
    cipherText: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

// 🔹 **Decrypt Message Using AES-256-GCM**
export async function decryptMessage(cipherText: string, ivBase64: string, key: CryptoKey): Promise<string> {
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
}

// === 📩 Firestore Messenger Functions ===

/**
 * Create (or return) a conversation document for these participants.
 */
export async function createConversation(participants: string[]): Promise<string> {
  const convRef = doc(collection(db, "conversations"));
  await setDoc(convRef, {
    participants,
    createdAt: serverTimestamp(),
  });
  return convRef.id;
}

/**
 * Send a message to a conversation.
 * Encrypts the text before storing.
 */
export async function sendMessage(conversationId: string, senderId: string, text: string, extraData?: object) {
  const key = await getEncryptionKey();
  const { cipherText, iv } = await encryptMessage(text, key);
  const messagesRef = collection(db, "conversations", conversationId, "messages");

  const messageData = {
    text: cipherText,
    iv,
    senderId,
    createdAt: serverTimestamp(),
    ...extraData, // e.g., fileUrl, fileName, fileType
  };

  await addDoc(messagesRef, messageData);

  // 🔹 **Update conversation's last message (optimized)**
  await setDoc(
    doc(db, "conversations", conversationId),
    { lastMessage: { text: cipherText, iv, senderId, createdAt: serverTimestamp() } },
    { merge: true }
  );
}

/**
 * Subscribe to messages in real-time.
 * Decrypts messages before passing them to the callback.
 * Uses a cached encryption key to avoid re-deriving it on every snapshot update.
 */
export function subscribeToMessages(conversationId: string, callback: (messages: DocumentData[]) => void) {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  const keyPromise = getEncryptionKey(); // derive once and reuse

  const unsubscribe = onSnapshot(q, async (snapshot) => {
    const key = await keyPromise;
    const messages = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        if (data.text && data.iv) {
          data.text = await decryptMessage(data.text, data.iv, key);
        }
        return { id: doc.id, ...data };
      })
    );
    callback(messages);
  });

  return unsubscribe;
}

/**
 * Retrieve conversation info (participants, etc.).
 */
export async function getConversation(conversationId: string) {
  const docRef = doc(db, "conversations", conversationId);
  const snap = await getDoc(docRef);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}