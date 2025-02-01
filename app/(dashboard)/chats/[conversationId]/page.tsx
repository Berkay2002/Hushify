"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import { subscribeToMessages, sendMessage } from "@/lib/messenger";
import { getConversationWithFriendData } from "@/lib/chatHelpers";
import { useAuth } from "@/lib/context/AuthContext";
import type { DocumentData } from "firebase/firestore";
import type { User } from "@/lib/interfaces";

export default function ConversationPage() {
  const router = useRouter();
  const { conversationId } = useParams();
  const { user } = useAuth();

  // Local state for messages, input text, loading, and friend data.
  const [messages, setMessages] = useState<DocumentData[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [friendData, setFriendData] = useState<User | null>(null);

  // Derive friend details with fallbacks.
  const friendName =
    friendData?.username ||
    friendData?.displayName ||
    friendData?.email ||
    "Unknown Friend";
  const photoURL = friendData?.photoURL || "/placeholder-user.jpg";

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!conversationId) return;

    // Fetch the conversation along with friend data.
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
      .catch((err) => console.error("Error fetching conversation:", err));

    // Subscribe to messages in real time.
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user, conversationId, router]);

  async function handleSend() {
    if (!text.trim() || !user) return;
    try {
      await sendMessage(conversationId as string, user.uid, text);
      setText("");
    } catch (err) {
      console.error("Error sending message:", err);
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
      <div className="flex-shrink-0 flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-700">
        <Image
          src={photoURL}
          alt="Friend Avatar"
          width={40}
          height={40}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex flex-col">
          <span className="font-semibold text-black dark:text-white">
            {friendName}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Active recently
          </span>
        </div>
      </div>

      {/* CHAT MESSAGES */}
      <div className="flex-1 min-h-0 p-4 space-y-3 overflow-y-auto">
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
      <div className="flex-shrink-0 flex items-center gap-2 p-3 border-t border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <input
          className="flex-1 px-3 py-2 rounded-full text-black dark:text-white border border-gray-300 dark:border-gray-700 bg-white dark:bg-black"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 rounded-full hover:bg-blue-600 text-white px-4 py-2"
        >
          Send
        </button>
      </div>
    </div>
  );
}
