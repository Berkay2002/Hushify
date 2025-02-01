// app/interfaces.ts

export interface ProductsPageProps {
  searchParams?: {
    offset?: string;
    q?: string;
  };
}

export interface FriendRequest {
  user1: string;
  user2: string;
}

export interface User {
  uid: string;
  displayName?: string;
  email: string;
  username?: string;
  photoURL?: string; // Added: optional property for profile picture URL
}

export interface Conversation {
  id: string;
  /**
   * Array of user UIDs who are participants in this conversation.
   */
  participants?: string[];
  /**
   * Timestamp or Date for when the conversation was created.
   */
  createdAt?: Date;
  lastMessage?: {
    text: string;
    senderId: string;
    /**
     * Timestamp or Date for when the last message was sent.
     */
    createdAt?: Date;
  };
}

/**
 * Props for the ConversationCard component.
 * Note: We augment Conversation with an optional friend property.
 */
export interface ConversationCardProps {
  conversation: Conversation & { friend?: User };
  currentUserUid: string;
}
