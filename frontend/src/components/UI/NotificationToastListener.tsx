/**
 * Listens for new notifications and shows a pop-up toast when one is added.
 * Renders nothing; must be inside NotificationsProvider.
 */

import { useEffect, useRef } from 'react';
import { useNotifications } from '../../contexts/NotificationsContext';
import { showNotificationToast } from '../../utils/toast';

export const NotificationToastListener: React.FC = () => {
  const { notifications } = useNotifications();
  const previousLengthRef = useRef(-1);

  useEffect(() => {
    const len = notifications.length;
    if (previousLengthRef.current >= 0 && len > previousLengthRef.current) {
      const newest = notifications[0];
      if (newest) {
        showNotificationToast(newest.title, newest.message);
      }
    }
    previousLengthRef.current = len;
  }, [notifications]);

  return null;
};
