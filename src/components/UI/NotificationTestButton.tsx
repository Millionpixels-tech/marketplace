// src/components/UI/NotificationTestButton.tsx
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createTestNotifications } from '../../utils/testNotifications';

interface NotificationTestButtonProps {
  className?: string;
}

const NotificationTestButton = ({ className = '' }: NotificationTestButtonProps) => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);

  const handleCreateTestNotifications = async () => {
    if (!user?.uid) return;
    
    setCreating(true);
    try {
      await createTestNotifications(user.uid);
      alert('Test notifications created! Check your notification dropdown.');
    } catch (error) {
      console.error('Error creating test notifications:', error);
      alert('Failed to create test notifications. Check console for details.');
    } finally {
      setCreating(false);
    }
  };

  // Only show in development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <button
      onClick={handleCreateTestNotifications}
      disabled={!user || creating}
      className={`px-3 py-1 text-xs rounded-lg border transition-colors ${
        creating 
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
          : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
      } ${className}`}
    >
      {creating ? 'Creating...' : '🧪 Test Notifications'}
    </button>
  );
};

export default NotificationTestButton;
