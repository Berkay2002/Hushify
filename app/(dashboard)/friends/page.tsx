'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getAcceptedFriends,
  getPendingRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend
} from '@/lib/friendships';
import { useAuth } from '@/lib/context/AuthContext';
import { FriendRequest, User } from '@/app/interfaces';
import { findUserByEmailOrUsername } from '@/lib/users';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function FriendsPage() {
  const { user } = useAuth();

  // States for accepted friends, pending requests, etc.
  const [friends, setFriends] = useState<User[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // States for searching a new friend
  const [searchTerm, setSearchTerm] = useState('');
  const [searched, setSearched] = useState(false);
  const [searchResult, setSearchResult] = useState<User | null>(null);

  // Load current user's accepted friends + pending requests
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    // getAcceptedFriends returns an array of user objects
    // getPendingRequests returns an array of { ...data, user }
    const [myFriends, myPending] = await Promise.all([
      getAcceptedFriends(user.uid),
      getPendingRequests(user.uid),
    ]);

    setFriends(myFriends.filter(Boolean) as User[]);
    setPendingRequests(myPending);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Accept a pending request
  async function handleAcceptRequest(otherUid: string) {
    if (!user) return;
    try {
      await acceptFriendRequest(user.uid, otherUid);
      await loadData();
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  }

  // Remove (or reject) a friend
  async function handleRemoveFriend(otherUid: string) {
    if (!user) return;
    try {
      await removeFriend(user.uid, otherUid);
      await loadData();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  }

  // Search by email/username -> send friend request
  async function handleSearchAndRequest() {
    if (!user || !searchTerm.trim()) return;
    setSearched(true);

    try {
      // find a user doc by email or username
      const foundUser = await findUserByEmailOrUsername(searchTerm.trim());
      setSearchResult(foundUser);
      if (!foundUser) {
        // Not found
        return;
      }

      await sendFriendRequest(user.uid, foundUser.uid);
      alert(
        `Friend request sent to ${
          foundUser.displayName || foundUser.username || foundUser.email
        }!`
      );
      setSearchTerm('');
      await loadData();
    } catch (err) {
      console.error('Error searching or sending friend request:', err);
    }
  }

  // If not signed in, show "Please Sign In"
  if (!user) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Please Sign In</CardTitle>
            <CardDescription>
              You need to be signed in to manage friends.{' '}
              <Link href="/login" className="text-blue-500">
                Go to Login
              </Link>
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <p className="text-sm text-muted-foreground">
          Loading friend data...
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      {/* Accepted Friends */}
      <Card>
        <CardHeader>
          <CardTitle>Friends</CardTitle>
          <CardDescription>
            These are your currently accepted friends
          </CardDescription>
        </CardHeader>
        <CardContent>
          {friends.length > 0 ? (
            <ul className="space-y-2">
              {friends.map((friend) => {
                // Fallback if friend.username is missing
                const friendName =
                  friend.username ||
                  friend.displayName ||
                  friend.email ||
                  friend.uid;

                return (
                  <li
                    key={friend.uid}
                    className="flex items-center justify-between"
                  >
                    <span>{friendName}</span>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveFriend(friend.uid)}
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No friends found.</p>
          )}
        </CardContent>
      </Card>

      {/* Pending Friend Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Friend Requests</CardTitle>
          <CardDescription>
            Manage your pending friend requests.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingRequests.length > 0 ? (
            <ul className="space-y-2">
              {pendingRequests.map((req) => {
                // req.user might be null if the user doc wasn't found
                if (!req.user) return null;

                const pendingName =
                  req.user.username ||
                  req.user.displayName ||
                  req.user.email ||
                  req.user.uid;

                return (
                  <li
                    key={`${req.user1}_${req.user2}`}
                    className="flex justify-between items-center"
                  >
                    <span>{pendingName}</span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleAcceptRequest(req.user.uid)}
                      >
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveFriend(req.user.uid)}
                      >
                        Reject
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No pending friend requests.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Add a New Friend */}
      <Card>
        <CardHeader>
          <CardTitle>Add a New Friend</CardTitle>
          <CardDescription>
            Send a friend request by entering another user’s email or username
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Enter email or username"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button onClick={handleSearchAndRequest}>Send</Button>
            </div>

            {/* Show "not found" or "found" messages */}
            {searched && !searchResult && (
              <p className="text-sm text-red-500">
                No user found with that email or username.
              </p>
            )}
            {searchResult && (
              <p className="text-sm text-green-500">
                Found user:{' '}
                {searchResult.displayName ||
                  searchResult.username ||
                  searchResult.email}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
