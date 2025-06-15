// src/hooks/useUnreadMessages.ts
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getTotalUnreadCount } from "../utils/messaging";

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    // Initial load
    getTotalUnreadCount(user.uid).then(setUnreadCount);

    // Listen for wishlist updates (we can expand this to listen for message updates)
    const handleMessageUpdate = () => {
      getTotalUnreadCount(user.uid).then(setUnreadCount);
    };

    window.addEventListener("message-updated", handleMessageUpdate);
    return () => window.removeEventListener("message-updated", handleMessageUpdate);
  }, [user]);

  return unreadCount;
}
