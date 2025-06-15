// src/utils/messaging.ts
import { db } from "./firebase";
import { 
  collection, 
  doc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp, 
  getDocs,
  Timestamp
} from "firebase/firestore";

export interface Message {
  id: string;
  text: string;
  senderId: string;
  senderName: string;
  timestamp: Timestamp;
  read: boolean;
}

export interface ChatConversation {
  id: string;
  participants: string[]; // Array of user IDs
  participantNames: { [key: string]: string }; // Map of user ID to display name
  lastMessage: string;
  lastMessageTime: Timestamp;
  lastSenderId: string;
  unreadCount: { [key: string]: number }; // Map of user ID to unread count
  createdAt: Timestamp;
  // Optional: link to listing, shop, or user that initiated the conversation
  contextType?: 'listing' | 'shop' | 'user';
  contextId?: string;
  contextTitle?: string;
  // Enhanced context for listings
  listingDetails?: {
    id: string;
    name: string;
    price: number;
    image?: string;
    shopName?: string;
  };
}

// Create or get existing conversation between two users
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string,
  currentUserName: string,
  otherUserName: string,
  context?: {
    type: 'listing' | 'shop' | 'user';
    id: string;
    title: string;
    listingDetails?: {
      id: string;
      name: string;
      price: number;
      image?: string;
      shopName?: string;
    };
  }
): Promise<string> {
  const conversationsRef = collection(db, "conversations");
  
  // Check if conversation already exists
  const existingQuery = query(
    conversationsRef,
    where("participants", "array-contains", currentUserId)
  );
  
  const snapshot = await getDocs(existingQuery);
  
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.participants.includes(otherUserId)) {
      return docSnap.id;
    }
  }
  
  // Create new conversation
  const newConversation: Omit<ChatConversation, 'id'> = {
    participants: [currentUserId, otherUserId],
    participantNames: {
      [currentUserId]: currentUserName,
      [otherUserId]: otherUserName
    },
    lastMessage: "",
    lastMessageTime: serverTimestamp() as Timestamp,
    lastSenderId: "",
    unreadCount: {
      [currentUserId]: 0,
      [otherUserId]: 0
    },
    createdAt: serverTimestamp() as Timestamp,
    ...(context && {
      contextType: context.type,
      contextId: context.id,
      contextTitle: context.title,
      ...(context.listingDetails && {
        listingDetails: context.listingDetails
      })
    })
  };
  
  const docRef = await addDoc(conversationsRef, newConversation);
  return docRef.id;
}

// Send a message
export async function sendMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  text: string,
  recipientId: string
): Promise<void> {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const conversationRef = doc(db, "conversations", conversationId);
  
  // Add message to subcollection
  await addDoc(messagesRef, {
    text: text.trim(),
    senderId,
    senderName,
    timestamp: serverTimestamp(),
    read: false
  });
  
  // Update conversation last message and unread count
  const conversationDoc = await getDocs(query(collection(db, "conversations"), where("__name__", "==", conversationId)));
  if (!conversationDoc.empty) {
    const currentData = conversationDoc.docs[0].data();
    const currentUnreadCount = currentData.unreadCount || {};
    
    await updateDoc(conversationRef, {
      lastMessage: text.trim(),
      lastMessageTime: serverTimestamp(),
      lastSenderId: senderId,
      unreadCount: {
        ...currentUnreadCount,
        [recipientId]: (currentUnreadCount[recipientId] || 0) + 1
      }
    });
  }
}

// Mark messages as read
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId);
  
  // Reset unread count for this user
  const conversationDoc = await getDocs(query(collection(db, "conversations"), where("__name__", "==", conversationId)));
  if (!conversationDoc.empty) {
    const currentData = conversationDoc.docs[0].data();
    const currentUnreadCount = currentData.unreadCount || {};
    
    await updateDoc(conversationRef, {
      unreadCount: {
        ...currentUnreadCount,
        [userId]: 0
      }
    });
  }
  
  // Mark individual messages as read
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const unreadMessagesQuery = query(
    messagesRef,
    where("read", "==", false),
    where("senderId", "!=", userId)
  );
  
  const unreadSnapshot = await getDocs(unreadMessagesQuery);
  const batch = unreadSnapshot.docs.map(doc => 
    updateDoc(doc.ref, { read: true })
  );
  
  await Promise.all(batch);
}

// Subscribe to conversations for a user
export function subscribeToConversations(
  userId: string,
  callback: (conversations: ChatConversation[]) => void
) {
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId),
    orderBy("lastMessageTime", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const conversations: ChatConversation[] = [];
    snapshot.forEach(doc => {
      conversations.push({ id: doc.id, ...doc.data() } as ChatConversation);
    });
    callback(conversations);
  });
}

// Subscribe to messages in a conversation
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const messagesRef = collection(db, "conversations", conversationId, "messages");
  const q = query(messagesRef, orderBy("timestamp", "asc"));
  
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    snapshot.forEach(doc => {
      messages.push({ id: doc.id, ...doc.data() } as Message);
    });
    callback(messages);
  });
}

// Get total unread count for a user
export async function getTotalUnreadCount(userId: string): Promise<number> {
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId)
  );
  
  const snapshot = await getDocs(q);
  let totalUnread = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const unreadCount = data.unreadCount?.[userId] || 0;
    totalUnread += unreadCount;
  });
  
  return totalUnread;
}
