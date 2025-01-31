'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext'; // your context storing current user
import { getUserByEmail } from '@/lib/users';
import { sendFriendRequest } from '@/lib/friendships';

// Shadcn UI or similar:
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function AddByEmailPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  interface User {
    uid: string;
    displayName?: string;
    email: string;
  }

  const [foundUser, setFoundUser] = useState<User | null>(null);
  const [searched, setSearched] = useState(false);

  // Search by email in /users collection
  async function handleSearch() {
    setSearched(true);
    if (!email.trim()) return;

    try {
      const usr = await getUserByEmail(email.trim());
      setFoundUser(usr);
    } catch (err) {
      console.error('Error searching user by email:', err);
    }
  }

  // Send friend request if we found a user
  async function handleAddFriend() {
    if (!user || !foundUser) return;
    try {
      await sendFriendRequest(user.uid, foundUser.uid);
      alert('Friend request sent!');
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  }

  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>Must be signed in to add friends.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Friend by Email</CardTitle>
          <CardDescription>
            Enter a users email to find them and send a friend request.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="someone@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>

          {searched && !foundUser && (
            <p className="text-sm text-red-500">No user found with that email</p>
          )}

          {foundUser && (
            <div className="space-y-2">
              <p>
                Found user: <strong>{foundUser.displayName ?? foundUser.email}</strong>
              </p>
              <Button variant="outline" onClick={handleAddFriend}>
                Send Friend Request
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
