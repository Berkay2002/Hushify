'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  subscribeToMessages,
  sendMessage,
} from '@/lib/messenger';
import { useAuth } from '@/lib/context/AuthContext'; // If you track user in a context
import type { DocumentData } from 'firebase/firestore';

export default function ConversationPage({
  params,
}: {
  params: { conversationId: string };
}) {
  const router = useRouter();
  const { user } = useAuth(); // Current Firebase user
  const [messages, setMessages] = useState<DocumentData[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);

  const { conversationId } = params;

  useEffect(() => {
    // If user isn't logged in, maybe redirect:
    if (!user) {
      router.push('/login');
      return;
    }

    // Subscribe to real-time messages
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    // Cleanup on unmount
    return () => unsubscribe();
  }, [user, conversationId, router]);

  const handleSend = async () => {
    if (!text.trim()) return;
    if (!user) return;

    try {
      await sendMessage(conversationId, user.uid, text);
      setText('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-xl mb-4">Conversation: {conversationId}</h2>

      <div className="border rounded p-2 mb-2 h-64 overflow-y-auto bg-white">
        {messages.map((msg) => (
          <div key={msg.id} className="mb-2">
            <strong>{msg.senderId}:</strong> {msg.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 border rounded p-2"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={handleSend}>
          Send
        </button>
      </div>
    </div>
  );
}
