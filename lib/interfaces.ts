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
    email?: string;
    username?: string;
  }
  
  export interface Conversation {
    id: string;
    /**
     * Array of user UIDs who are participants in this conversation.
     */
    participants?: string[];
  
    /**
     * Timestamp or Date for when the conversation was created.
     * In Firestore, this might be a FieldValue / Timestamp,
     * so you can type `any` or a more specific type depending on usage.
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
 * A single conversation item, styled like Messenger:
 * Profile pic left, username + last message on the right.
 */
export interface ConversationCardProps {
    conversation: Conversation;
    currentUserUid: string;
  }