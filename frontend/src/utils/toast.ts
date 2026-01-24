import React from 'react';
import toast from 'react-hot-toast';

// Success notifications
export const showSuccess = (message: string) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-right',
  });
};

// Error notifications
export const showError = (message: string) => {
  toast.error(message, {
    duration: 5000,
    position: 'top-right',
  });
};

// Warning notifications
export const showWarning = (message: string) => {
  toast(message, {
    icon: '⚠️',
    duration: 4000,
    position: 'top-right',
  });
};

// Info notifications
export const showInfo = (message: string) => {
  toast(message, {
    icon: 'ℹ️',
    duration: 3000,
    position: 'top-right',
  });
};

// Loading notifications
export const showLoading = (message: string) => {
  return toast.loading(message, {
    position: 'top-right',
  });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

// Dismiss loading and show success
export const dismissLoadingAndShowSuccess = (toastId: string, message: string) => {
  toast.dismiss(toastId);
  showSuccess(message);
};

// Dismiss loading and show error
export const dismissLoadingAndShowError = (toastId: string, message: string) => {
  toast.dismiss(toastId);
  showError(message);
};

/** Toast with Undo button. onUndo called when Undo clicked; toast dismissed. */
export const showToastWithUndo = (
  message: string,
  onUndo: () => void,
  durationMs = 5000
) => {
  const toastId = toast.custom(
    (t) =>
      React.createElement(
        'div',
        {
          className: 'flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-800 border border-white/10 shadow-xl',
          role: 'alert',
        },
        React.createElement('span', { className: 'text-sm text-white' }, message),
        React.createElement('button', {
          type: 'button',
          onClick: () => {
            onUndo();
            toast.dismiss(t.id);
          },
          className:
            'px-3 py-1 text-xs font-black uppercase tracking-widest rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30 transition-colors',
          children: 'Undo',
        })
      ),
    { duration: durationMs, position: 'top-right' }
  );
  return toastId;
};

// Admin-specific notifications
export const adminNotifications = {
  userCreated: () => showSuccess('User created successfully'),
  userUpdated: () => showSuccess('User updated successfully'),
  userDeleted: () => showSuccess('User deleted successfully'),
  userSuspended: () => showWarning('User suspended successfully'),
  userActivated: () => showSuccess('User activated successfully'),
  roleCreated: () => showSuccess('Role created successfully'),
  roleUpdated: () => showSuccess('Role updated successfully'),
  roleDeleted: () => showSuccess('Role deleted successfully'),
  propertyCreated: () => showSuccess('Property created successfully'),
  propertyUpdated: () => showSuccess('Property updated successfully'),
  propertyDeleted: () => showSuccess('Property deleted successfully'),
  settingsSaved: () => showSuccess('Settings saved successfully'),
  backupCreated: () => showSuccess('Backup created successfully'),
  auditLogExported: () => showSuccess('Audit log exported successfully'),
  permissionDenied: () => showError('Permission denied'),
  operationFailed: (operation: string) => showError(`${operation} failed`),
  networkError: () => showError('Network error. Please try again.'),
}; 