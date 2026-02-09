/**
 * Security tab — Gold Standard (Patrol card header pattern).
 * Each card: CardTitle contains only left-aligned icon+title (no header button).
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Modal } from '../../../../components/UI/Modal';
import { useProfileSettingsContext } from '../../context/ProfileSettingsContext';
import { useAuth } from '../../../../hooks/useAuth';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const labelClass = 'block text-xs font-bold text-white mb-2 uppercase tracking-wider';
const errorClass = 'text-[10px] text-red-400 font-black uppercase tracking-tight ml-1';

export const SecurityTab: React.FC = () => {
  const { clearCacheAndLogout } = useAuth();
  const {
    profile,
    loading,
    twoFAEnabled,
    sessions,
    load2FAStatus,
    loadSessions,
    changePassword,
    enable2FA,
    disable2FA,
    revokeSession,
  } = useProfileSettingsContext();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [showDisable2FAModal, setShowDisable2FAModal] = useState(false);

  useEffect(() => {
    load2FAStatus();
    loadSessions();
  }, [load2FAStatus, loadSessions]);

  const validatePassword = (): boolean => {
    const next: Record<string, string> = {};
    if (!currentPassword.trim()) next.currentPassword = 'Current password is required';
    if (!newPassword.trim()) next.newPassword = 'New password is required';
    else if (newPassword.length < 8) next.newPassword = 'At least 8 characters required';
    if (newPassword !== confirmPassword) next.confirmPassword = 'Passwords do not match';
    setPasswordErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpdatePassword = async () => {
    if (!validatePassword()) return;
    const ok = await changePassword(currentPassword, newPassword);
    if (ok) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    }
  };

  const handleDisable2FA = async () => {
    const ok = await disable2FA();
    if (ok) setShowDisable2FAModal(false);
  };

  return (
    <div className="space-y-6 pt-8" role="main" aria-label="Security">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Security</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Password, 2FA, sessions, and sign out
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-key text-white" aria-hidden />
              </div>
              <span className="card-title-text">Change Password</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={inputClass + (passwordErrors.currentPassword ? ' border-red-500/50' : '')}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {passwordErrors.currentPassword && (
                <p className={errorClass}>{passwordErrors.currentPassword}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass + (passwordErrors.newPassword ? ' border-red-500/50' : '')}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {passwordErrors.newPassword && <p className={errorClass}>{passwordErrors.newPassword}</p>}
            </div>
            <div>
              <label className={labelClass}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass + (passwordErrors.confirmPassword ? ' border-red-500/50' : '')}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {passwordErrors.confirmPassword && (
                <p className={errorClass}>{passwordErrors.confirmPassword}</p>
              )}
            </div>
          </div>
          <Button variant="primary" onClick={handleUpdatePassword} disabled={loading.save} aria-label="Update password">
            <i className="fas fa-key mr-2" aria-hidden />
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-mobile-alt text-white" aria-hidden />
              </div>
              <span className="card-title-text">Two-Factor Authentication</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-[color:var(--text-sub)]">
                Add an extra layer of security to your account.
              </p>
            </div>
            <Badge variant={twoFAEnabled ? 'success' : 'secondary'}>
              {twoFAEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            {!twoFAEnabled ? (
              <Button variant="outline" onClick={() => enable2FA()} aria-label="Enable 2FA">
                <i className="fas fa-mobile-alt mr-2" aria-hidden />
                Enable 2FA
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => enable2FA()} aria-label="Manage 2FA">
                  <i className="fas fa-mobile-alt mr-2" aria-hidden />
                  Manage 2FA
                </Button>
                <Button variant="outline" onClick={() => setShowDisable2FAModal(true)} aria-label="Disable 2FA">
                  <i className="fas fa-times mr-2" aria-hidden />
                  Disable
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-desktop text-white" aria-hidden />
              </div>
              <span className="card-title-text">Active Sessions</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {loading.sessions ? (
            <div className="flex items-center justify-center py-8">
              <div
                className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"
                role="status"
                aria-label="Loading sessions"
              />
            </div>
          ) : !sessions.length ? (
            <EmptyState
              icon="fas fa-desktop"
              title="No Other Sessions"
              description="Only this device is currently logged in."
            />
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <i
                      className={session.current ? 'fas fa-desktop text-blue-400' : 'fas fa-mobile-alt text-slate-500'}
                      aria-hidden
                    />
                    <div>
                      <p className="font-bold text-white">{session.device}</p>
                      <p className="text-sm text-[color:var(--text-sub)]">
                        {session.current
                          ? 'Current session'
                          : `Last active ${typeof session.lastActive === 'number'
                              ? new Date(session.lastActive * 1000).toLocaleString()
                              : session.lastActive}`}{' '}
                        • {session.location}
                      </p>
                    </div>
                  </div>
                  {session.current ? (
                    <Badge variant="success">Active</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeSession(session.id)}
                      aria-label={`Revoke session ${session.device}`}
                    >
                      Revoke
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-amber-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-broom text-white" aria-hidden />
              </div>
              <span className="card-title-text">Clear cache and sign out</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <p className="text-sm text-[color:var(--text-sub)] mb-4">
            Clear all local cache (auth, feature data) and sign out. After refreshing, you will see the login page again.
          </p>
          <Button
            variant="warning"
            onClick={() => clearCacheAndLogout()}
            aria-label="Clear cache and sign out"
          >
            <i className="fas fa-broom mr-2" aria-hidden />
            Clear cache and sign out
          </Button>
        </CardContent>
      </Card>

      <Modal
        isOpen={showDisable2FAModal}
        onClose={() => setShowDisable2FAModal(false)}
        title="Disable 2FA"
        size="sm"
        footer={
          <>
            <Button variant="subtle" onClick={() => setShowDisable2FAModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDisable2FA} disabled={loading.save}>
              {loading.save ? (
                <>
                  <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                  Disabling...
                </>
              ) : (
                'Disable 2FA'
              )}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--text-sub)]">
          Are you sure you want to disable two-factor authentication? Your account will be less secure.
        </p>
      </Modal>
    </div>
  );
};
