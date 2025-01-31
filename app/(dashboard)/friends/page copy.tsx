'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getAcceptedFriends,
  getPendingRequests
} from '@/lib/friendships';
import { useAuth } from '@/lib/context/AuthContext';

export default function FriendsPage() {
  const { user } = useAuth();
  const [friendUid, setFriendUid] = useState('');
  const [friends, setFriends] = useState<string[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ user1: string; user2: string }[]>([]);
  const [loading, setLoading] = useState(true);

  // Load the current user's accepted friends + pending requests
  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [myFriends, myPending] = await Promise.all([
      getAcceptedFriends(user.uid),
      getPendingRequests(user.uid),
    ]);

    setFriends(myFriends);
    setPendingRequests(myPending);
    setLoading(false);
  }, [user]);

  // On mount or when user changes, load data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  // Handler to send friend request
  async function handleSendRequest() {
    if (!user || !friendUid) return;
    try {
      await sendFriendRequest(user.uid, friendUid);
      setFriendUid('');
      await loadData();
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  }

  // Handler to accept a pending request
  async function handleAcceptRequest(otherUid: string) {
    if (!user) return;
    try {
      await acceptFriendRequest(user.uid, otherUid);
      await loadData();
    } catch (err) {
      console.error('Error accepting friend request:', err);
    }
  }

  // Handler to remove a friend or reject a request
  async function handleRemoveFriend(otherUid: string) {
    if (!user) return;
    try {
      await removeFriend(user.uid, otherUid);
      await loadData();
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  }

  if (!user) {
    return <div>Please sign in to manage friends.</div>;
  }

  if (loading) {
    return <div>Loading friend data...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2>Friends</h2>
      {friends.length === 0 ? (
        <p>No accepted friends yet.</p>
      ) : (
        <ul>
          {friends.map((fid) => (
            <li key={fid}>
              {fid}{' '}
              <button onClick={() => handleRemoveFriend(fid)}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Pending Requests</h2>
      {pendingRequests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        <ul>
          {pendingRequests.map((req) => (
            <li key={`${req.user1}_${req.user2}`}>
              Request from {req.user1}{' '}
              <button onClick={() => handleAcceptRequest(req.user1)}>
                Accept
              </button>{' '}
              <button onClick={() => handleRemoveFriend(req.user1)}>
                Reject
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>Send Friend Request</h2>
      <input
        value={friendUid}
        onChange={(e) => setFriendUid(e.target.value)}
        placeholder="Enter friend's UID"
      />
      <button onClick={handleSendRequest}>Send</button>
    </div>
  );
}
