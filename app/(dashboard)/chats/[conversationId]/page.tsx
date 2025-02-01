"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { subscribeToMessages, sendMessage } from "@/lib/messenger";
import { getConversationWithFriendData } from "@/lib/chatHelpers";
import { useAuth } from "@/lib/context/AuthContext";
import type { DocumentData } from "firebase/firestore";
import type { User } from "@/lib/interfaces";

// Import Firebase Storage functions:
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebaseConfig";

// Import the Plus icon from lucide-react.
import { Plus } from "lucide-react";

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  const conversationId = Array.isArray(params.conversationId)
    ? params.conversationId[0]
    : params.conversationId;

  const { user } = useAuth();

  const [messages, setMessages] = useState<DocumentData[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [friendData, setFriendData] = useState<User | null>(null);

  const friendName =
    friendData?.username ||
    friendData?.displayName ||
    friendData?.email ||
    "Unknown Friend";
  const photoURL = friendData?.photoURL || "/placeholder-user.jpg";

  // Refs for the messages container, textarea, and file input.
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get Firebase Storage instance.
  const storage = getStorage(app);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!conversationId) return;

    // Fetch the conversation with friend data.
    getConversationWithFriendData(conversationId, user.uid)
      .then((convo) => {
        console.log("Fetched conversation:", convo);
        if (!convo) {
          console.error("Conversation not found");
          return;
        }
        if (convo.friend) {
          setFriendData(convo.friend);
        } else {
          console.warn("Friend data not found in conversation.");
        }
      })
      .catch((err) => console.error("Error fetching conversation doc:", err));

    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, conversationId, router]);

  // Auto-scroll to the bottom when messages update.
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Auto-resize the textarea when text changes.
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  async function handleSend() {
    if (!text.trim() || !user || !conversationId) return;
    try {
      // Send a normal text message.
      await sendMessage(conversationId, user.uid, text);
      setText("");
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter will insert a newline naturally.
  }

  // File input change handler:
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0 || !user || !conversationId) return;
    const file = e.target.files[0];

    // Create a reference in Firebase Storage.
    const storageRef = ref(storage, `chatFiles/${conversationId}/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      () => {
        // Optionally, monitor upload progress.
      },
      (error) => {
        console.error("Error uploading file:", error);
      },
      async () => {
        // When upload completes, get the download URL.
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        try {
          // Send a message with file metadata.
          await sendMessage(conversationId, user.uid, text, {
            fileUrl: downloadURL,
            fileName: file.name,
            fileType: file.type,
          });
          setText(""); // Clear text if used as a caption.
        } catch (err) {
          console.error("Error sending file message:", err);
        }
      }
    );
  }

  // Trigger file selection.
  function handleFileUploadClick() {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-black dark:text-white">
        Loading messages...
      </div>
    );
  }

  return (
    <div className="w-full mx-auto border border-gray-300 dark:border-gray-700 rounded-xl flex flex-col h-[95vh] bg-white dark:bg-black text-black dark:text-white overflow-hidden">
      
      {/* TOP BAR / HEADER */}
      <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-gray-100 dark:bg-[#2b2d31] border-b border-gray-300 dark:border-[#202225]">
        <Image
          src={photoURL}
          alt="Friend Avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-black dark:text-white">{friendName}</span>
          <span className="text-sm text-gray-600 dark:text-gray-400">Active recently</span>
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto dark:bg-[#313338] scrollbar-hide">
        {messages.map((msg) => {
          const isCurrentUser = msg.senderId === user?.uid;
          return (
            <div
              key={msg.id}
              className={`flex items-end ${isCurrentUser ? "justify-end" : "justify-start"}`}
            >
              {!isCurrentUser && (
                <Image
                  src={photoURL}
                  alt="Friend Avatar"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover mr-2"
                />
              )}
              <div
                className={`px-3 py-2 rounded-2xl ${
                  isCurrentUser
                    ? "bg-blue-200 dark:bg-[#5865F2] text-black dark:text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                }`}
              >
                {msg.text}
                {msg.fileUrl && (
                  <div className="mt-2">
                    {msg.fileType.startsWith("image/") ? (
                      <Image
                        src={msg.fileUrl}
                        alt={msg.fileName}
                        width={200}
                        height={200}
                        className="rounded"
                      />
                    ) : (
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 underline"
                      >
                        {msg.fileName || "View File"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM INPUT */}
      <div className="relative flex-shrink-0 p-3 dark:bg-[#313338]">
        {/* Fixed Attach Button */}
        <button
          className="absolute left-4 top-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-700/30 text-gray-500 dark:text-gray-400"
          onClick={handleFileUploadClick}
        >
          <Plus size={25} />
        </button>
        {/* Textarea with left padding to avoid overlap with the attach button */}
        <textarea
          ref={textareaRef}
          className="w-full pl-12 pr-4 py-2 overflow-hidden rounded-xl text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#3b3d42] resize-none focus:outline-none"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ minHeight: "40px", maxHeight: "150px" }}
        />
        {/* File input is hidden */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
