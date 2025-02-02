"use client";

import Link from "next/link";
import Image from "next/image";
import { MessageSquare } from "lucide-react";
import type { User } from "@/lib/interfaces";

// Define props for the OnlineCard component.
interface OnlineCardProps {
  user: User; // Fetches user details dynamically
  className?: string;
}

export function OnlineCard({ user, className }: OnlineCardProps) {
  const userName = user.username || user.displayName || user.email || "Unknown User"; // Use available user properties
  const photoURL = user.photoURL || "/placeholder-user.jpg"; // Default to placeholder if no photoURL

  return (
    <div className={`flex items-center justify-between p-2 rounded-md hover:bg-gray-700/40 ${className ?? ""}`}>
      {/* Profile Image & Info */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10">
          <Image
            src={photoURL}
            alt={`${userName} Avatar`}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold">{userName}</span>
        </div>
      </div>

      {/* Message Button */}
      <Link href={`/chats/${user.uid}`} className="p-2 rounded-full hover:bg-gray-700/50">
        <MessageSquare className="w-5 h-5 text-gray-400" />
      </Link>
    </div>
  );
}
