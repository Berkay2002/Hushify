'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { searchUsers } from '@/lib/userSearch'; // We'll define this
import { sendFriendRequest } from '@/lib/friendships';
import { useAuth } from '@/lib/context/AuthContext';
import { User } from '@/lib/interfaces';


export default function UserSearchPage() {
  const [term, setTerm] = useState('');

  const [results, setResults] = useState<User[]>([]);
  const { user } = useAuth();

  async function handleSearch() {
    try {
      const found = await searchUsers(term);
      setResults(found);
    } catch (err) {
      console.error('Error searching:', err);
    }
  }

  async function handleAddFriend(otherUid: string) {
    if (!user) return;
    try {
      await sendFriendRequest(user.uid, otherUid);
      alert('Friend request sent!');
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search username"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
        <Button onClick={handleSearch}>Search</Button>
      </div>

      <ul className="space-y-2">
        {results.map((u) => (
          <li key={u.uid} className="flex items-center justify-between">
            <div>
              <p className="font-medium">{u.displayName || u.username}</p>
              <p className="text-sm text-muted-foreground">UID: {u.uid}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => handleAddFriend(u.uid)}>
              Add Friend
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
