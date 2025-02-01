"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { subscribeToMessages, sendMessage } from "@/lib/messenger";
import { getConversationWithFriendData } from "@/lib/chatHelpers";
import { useAuth } from "@/lib/context/AuthContext";
import type { DocumentData } from "firebase/firestore";
import type { User } from "@/lib/interfaces";

export default function ConversationPage() {
  const router = useRouter();
  const params = useParams();
  // Extract conversationId as a string:
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

  // Refs for the messages container and the textarea.
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Fetch conversation and subscribe to messages.
  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!conversationId) return;

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
      // Reset height to auto so that we can recalculate the scrollHeight correctly.
      textareaRef.current.style.height = "auto";
      // Set height to the scrollHeight, capped at 150px.
      const newHeight = Math.min(textareaRef.current.scrollHeight, 150);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [text]);

  async function handleSend() {
    if (!text.trim() || !user || !conversationId) return;
    try {
      await sendMessage(conversationId, user.uid, text);
      setText(""); // Clear the textarea after sending.
    } catch (err) {
      console.error("Error sending message:", err);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      // Prevent newline insertion and send the message.
      e.preventDefault();
      handleSend();
    }
    // Shift+Enter will insert a newline naturally.
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
      <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
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
      <div ref={messagesContainerRef} className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto">
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
                    ? "bg-blue-200 dark:bg-blue-500 text-black dark:text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-black dark:text-white"
                }`}
              >
                {msg.text}
              </div>
            </div>
          );
        })}
      </div>

      {/* BOTTOM INPUT */}
      <div className="flex-shrink-0 flex flex-col gap-2 p-3 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <textarea
          ref={textareaRef}
          className="w-full px-3 py-2 rounded-lg text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black resize-none focus:outline-none"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ minHeight: "40px", maxHeight: "150px" }}
        />
      </div>
    </div>
  );
}
