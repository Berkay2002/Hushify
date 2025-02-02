// components/ui/conversationCards.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Conversation, User } from "@/lib/interfaces";
import { getEncryptionKey, decryptMessage } from "@/lib/messenger"; // Import your decryption helpers

// Define props for the ConversationCard component.
interface ConversationCardProps {
  conversation: Conversation & { friend?: User };
  className?: string;
}

export function ConversationCard({ conversation, className }: ConversationCardProps) {
  const friend = conversation.friend;
  const friendName =
    friend?.username || friend?.displayName || friend?.email || "Unknown Friend";
  const photoURL = friend?.photoURL || "/placeholder-user.jpg";

  // State for the decrypted last message. Start with a placeholder.
  const [decryptedLastMsg, setDecryptedLastMsg] = useState<string>("Decrypting...");

  useEffect(() => {
    async function decryptLastMessage() {
      if (conversation.lastMessage && conversation.lastMessage.text && conversation.lastMessage.iv) {
        try {
          const key = await getEncryptionKey();
          const decrypted = await decryptMessage(
            conversation.lastMessage.text,
            conversation.lastMessage.iv,
            key
          );
          setDecryptedLastMsg(decrypted);
        } catch (error) {
          console.error("Failed to decrypt last message:", error);
          setDecryptedLastMsg("**[Message cannot be decrypted]**");
        }
      } else {
        setDecryptedLastMsg("No messages yet");
      }
    }
    decryptLastMessage();
  }, [conversation.lastMessage]);

  return (
    <Link href={`/chats/${conversation.id}`}>
      <div className={`flex items-center gap-3 p-2 rounded cursor-pointer ${className ?? ""}`}>
        <div className="w-12 h-12 relative">
          <Image
            src={photoURL}
            alt="Friend Avatar"
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col overflow-hidden">
          <span className="text-base font-semibold leading-tight">
            {friendName}
          </span>
          <span className="text-sm text-gray-400 truncate">
            {decryptedLastMsg}
          </span>
        </div>
      </div>
    </Link>
  );
}
