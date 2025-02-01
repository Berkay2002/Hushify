"use client";

import { ConversationCardProps } from "@/app/interfaces";
import Link from "next/link";
import Image from "next/image";

export function ConversationCard({ conversation }: ConversationCardProps) {
  const friend = conversation.friend;
  const friendName = friend?.username || friend?.displayName || friend?.email || "Unknown Friend";
  const photoURL = friend?.photoURL || "/placeholder-user.jpg";
  const lastMsg = conversation.lastMessage;

  return (
    <Link href={`/chats/${conversation.id}`}>
      <div className="flex items-center gap-3 p-2 rounded cursor-pointer">
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
            {lastMsg ? `Last: ${lastMsg.text} by ${lastMsg.senderId}` : "No messages yet"}
          </span>
        </div>
      </div>
    </Link>
  );
}
