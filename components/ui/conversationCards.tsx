'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { findUserByUid } from '@/lib/users';
import type { ConversationCardProps, User } from '@/app/interfaces';


export function ConversationCard({ conversation, currentUserUid }: ConversationCardProps) {
  const [friend, setFriend] = useState<User | null>(null);

  useEffect(() => {
    // For a 2-person chat: find the "other" user
    if (conversation.participants?.length === 2) {
      const friendUid = conversation.participants.find((p) => p !== currentUserUid);
      if (friendUid) {
        // Fetch friend’s user doc from /users
        findUserByUid(friendUid).then((f) => setFriend(f));
      }
    }
  }, [conversation, currentUserUid]);

  const lastMsg = conversation.lastMessage;
  const friendName = friend?.username || friend?.displayName || friend?.email || 'Unknown User';
  const friendPhoto = friend?.photoURL || '/placeholder-user.jpg'; // fallback image
  const lastMessageText = lastMsg?.text || 'No messages yet';
  const lastMessageSender = lastMsg?.senderId === currentUserUid ? 'You:' : '';

  return (
    <Link href={`/chat/${conversation.id}`}>
      {/* Container for the entire item */}
      <div className="flex items-center gap-3 p-3 rounded hover:bg-gray-800 cursor-pointer">
        {/* Profile Picture Left */}
        <div className="w-12 h-12 relative">
          <Image
            src={friendPhoto}
            alt="Friend Avatar"
            fill
            className="rounded-full object-cover"
          />
        </div>

        {/* Text Section: Username on top, last message below */}
        <div className="flex flex-col overflow-hidden">
          <span className="text-base font-semibold leading-tight">
            {friendName}
          </span>
          <span className="text-sm text-gray-400 truncate">
            {lastMessageSender ? `${lastMessageSender} ` : ''}
            {lastMessageText}
          </span>
        </div>

        {/* Optionally, a small timestamp or unread badge on the far right */}
        {/* 
        <div className="ml-auto text-sm text-gray-400 whitespace-nowrap">
          8 w
        </div>
        */}
      </div>
    </Link>
  );
}
