import { Toaster, toast } from 'sonner';

const NotificationService = {
  permission: 'default',

  async init() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
      if (this.permission === 'default') {
        this.permission = await Notification.requestPermission();
      }
    }
  },

  send(title, options = {}) {
    // Always show toast
    const toastType = options.type || 'default';
    if (toastType === 'success') {
      toast.success(title, { description: options.body });
    } else if (toastType === 'error') {
      toast.error(title, { description: options.body });
    } else if (toastType === 'warning') {
      toast.warning(title, { description: options.body });
    } else {
      toast(title, { description: options.body });
    }

    // Also try browser notification
    if ('Notification' in window && this.permission === 'granted') {
      try {
        new Notification(title, {
          body: options.body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        });
      } catch (e) {
        // Silent fail for browser notifications
      }
    }
  },

  success(title, body) { this.send(title, { body, type: 'success' }); },
  error(title, body) { this.send(title, { body, type: 'error' }); },
  warning(title, body) { this.send(title, { body, type: 'warning' }); },
  info(title, body) { this.send(title, { body, type: 'default' }); },
};

export { NotificationService, Toaster, toast };
