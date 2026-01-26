/**
 * Users Tab Component
 * Extracted from monolithic AccessControlModule.tsx (lines 2547-2896)
 * 
 * Gold Standard Checklist:
 * ✅ Uses useAccessControlContext() hook - consumes data from context
 * ✅ Wrapped in ErrorBoundary - error isolation
 * ✅ React.memo applied - prevents unnecessary re-renders
 * ✅ Accessibility (a11y) - ARIA labels, keyboard navigation, semantic HTML
 * ✅ Modular sub-components - UsersFilter extracted
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { Avatar } from '../../../../components/UI/Avatar';
import { ErrorBoundary } from '../../../../components/UI/ErrorBoundary';
import LoadingSpinner from '../../../../components/UI/LoadingSpinner';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Modal } from '../../../../components/UI/Modal';
import { useAccessControlContext } from '../../context/AccessControlContext';
import { UsersFilter } from '../filters/UsersFilter';
import { showSuccess, showError, showLoading, dismissLoadingAndShowSuccess, dismissLoadingAndShowError } from '../../../../utils/toast';
import type { AccessControlUser } from '../../../../shared/types/access-control.types';
import { CreateUserModal, EditUserModal } from '../modals';
import { cn } from '../../../../utils/cn';

/**
 * Users Tab Component
 * Displays users in a list with filtering, selection, and management capabilities
 */
const UsersTabComponent: React.FC = () => {
  const {
    users,
    loading,
    createUser,
    updateUser,
    deleteUser,
    refreshUsers,
    recordAuditEntry,
  } = useAccessControlContext();
  const navigate = useNavigate();

  // Local UI state for filtering and selection (UI state, not business state)
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'manager' | 'employee' | 'guest' | 'security' | 'executive' | 'it' | 'contractor'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkReason, setBulkReason] = useState('');
  const [bulkResult, setBulkResult] = useState<{ successes: number; failures: string[] } | null>(null);
  const [lastBulkAction, setLastBulkAction] = useState<{
    status: AccessControlUser['status'];
    count: number;
    reason?: string;
    timestamp: Date;
  } | null>(null);
  const [lastRefreshAt, setLastRefreshAt] = useState<Date | null>(null);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const isStale = !lastRefreshAt || Date.now() - lastRefreshAt.getTime() > 60000;

  const handleManualRefresh = useCallback(async () => {
    try {
      await refreshUsers();
      setLastRefreshAt(new Date());
      setRefreshError(null);
    } catch (error) {
      setRefreshError('Live refresh failed. Showing last known state.');
    }
  }, [refreshUsers]);
  const [selectedUser, setSelectedUser] = useState<AccessControlUser | null>(null);
  const [isCreateFormDirty, setIsCreateFormDirty] = useState(false);
  const [isEditFormDirty, setIsEditFormDirty] = useState(false);

  useEffect(() => {
    const refresh = () => {
      refreshUsers()
        .then(() => {
          setLastRefreshAt(new Date());
          setRefreshError(null);
        })
        .catch(() => {
          setRefreshError('Live refresh failed. Showing last known state.');
        });
    };
    refresh();
    const intervalId = window.setInterval(refresh, 30000);
    return () => {
      window.clearInterval(intervalId);
    };
  }, [refreshUsers]);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    let filtered = (users || []).filter(u => u);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.department.toLowerCase().includes(query) ||
        (user.employeeId && user.employeeId.toLowerCase().includes(query))
      );
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter);
    }

    return filtered;
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handle create user
  const handleCreateUser = useCallback(async (userData: Partial<AccessControlUser>) => {
    const toastId = showLoading('Creating User...');
    try {
      await createUser(userData);
      dismissLoadingAndShowSuccess(toastId, 'User created successfully.');
      if (userData.name) {
        recordAuditEntry({
          action: 'Create user',
          status: 'success',
          target: userData.name
        });
      }
      setShowCreateModal(false);
      setIsCreateFormDirty(false);
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'User creation failed.');
      if (userData.name) {
        recordAuditEntry({
          action: 'Create user',
          status: 'failure',
          target: userData.name
        });
      }
    }
  }, [createUser, recordAuditEntry]);

  // Handle edit user
  const handleEditUser = useCallback((user: AccessControlUser) => {
    setSelectedUser(user);
    setIsEditFormDirty(false);
    setShowEditModal(true);
  }, []);

  // Handle update user
  const handleUpdateUser = useCallback(async (userId: string, userData: Partial<AccessControlUser>) => {
    const toastId = showLoading('Updating User...');
    try {
      await updateUser(userId, userData);
      dismissLoadingAndShowSuccess(toastId, 'User updated.');
      if (userData.name) {
        recordAuditEntry({
          action: 'Update user',
          status: 'success',
          target: userData.name
        });
      }
      setShowEditModal(false);
      setSelectedUser(null);
      setIsEditFormDirty(false);
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Update failed.');
      if (userData.name) {
        recordAuditEntry({
          action: 'Update user',
          status: 'failure',
          target: userData.name
        });
      }
    }
  }, [recordAuditEntry, updateUser]);

  // Handle delete user
  const handleDeleteUser = useCallback(async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const user = users.find(candidate => candidate.id === userId);
      try {
        await deleteUser(userId);
        setSelectedUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
        showSuccess('User deleted.');
        if (user) {
          recordAuditEntry({
            action: 'Delete user',
            status: 'success',
            target: user.name
          });
        }
      } catch (error) {
        showError('Delete failed.');
        if (user) {
          recordAuditEntry({
            action: 'Delete user',
            status: 'failure',
            target: user.name
          });
        }
      }
    }
  }, [deleteUser, recordAuditEntry, users]);

  // Clear all filters
  const handleClearAllFilters = useCallback(() => {
    setSearchQuery('');
    setRoleFilter('all');
    setStatusFilter('all');
  }, []);

  const openBulkModal = useCallback(() => {
    setBulkReason('');
    setBulkResult(null);
    setShowBulkModal(true);
  }, []);

  const closeBulkModal = useCallback(() => {
    setShowBulkModal(false);
    setBulkReason('');
    setBulkResult(null);
  }, []);

  const handleBulkStatusUpdate = useCallback(async (status: AccessControlUser['status']) => {
    if (selectedUsers.size === 0) {
      showError('Please select users.');
      return;
    }
    if (status !== 'active' && !bulkReason.trim()) {
      showError('Reason is required for this bulk action.');
      return;
    }
    const selected = users.filter(user => selectedUsers.has(user.id));
    const toastId = showLoading(`Updating ${selected.length} user(s)...`);
    setBulkLoading(true);
    try {
      const results = await Promise.allSettled(
        selected.map(user => updateUser(user.id, { status }))
      );
      const failures = results
        .map((result, index) => (result.status === 'rejected' ? selected[index].name : null))
        .filter((name): name is string => Boolean(name));
      const successes = results.length - failures.length;
      setBulkResult({ successes, failures });
      setLastBulkAction({
        status,
        count: results.length,
        reason: bulkReason.trim() || undefined,
        timestamp: new Date()
      });
      recordAuditEntry({
        action: `Bulk user status: ${status.toUpperCase()}`,
        status: failures.length === 0 ? 'success' : 'failure',
        target: `${results.length} users`,
        reason: bulkReason.trim() || (failures.length > 0 ? `Failed: ${failures.join(', ')}` : undefined)
      });
      if (failures.length === 0) {
        dismissLoadingAndShowSuccess(toastId, 'Bulk update completed.');
        setSelectedUsers(new Set());
        closeBulkModal();
      } else {
        dismissLoadingAndShowError(toastId, `Bulk update partially failed (${failures.length}/${results.length}).`);
      }
    } catch (error) {
      dismissLoadingAndShowError(toastId, 'Bulk update failed.');
    } finally {
      setBulkLoading(false);
    }
  }, [bulkReason, closeBulkModal, recordAuditEntry, selectedUsers, updateUser, users]);

  // Loading state
  if (loading.users && users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />

        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading Users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="User Management">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-3xl font-black text-[color:var(--text-main)] uppercase tracking-tighter">User Management</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic opacity-70">
            Manage users and permissions
          </p>
          {lastRefreshAt && (
            <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mt-2 opacity-60">
              Last synced: {lastRefreshAt.toLocaleTimeString()}
            </p>
          )}
          {refreshError && (
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mt-1">
              {refreshError}
            </p>
          )}
          {lastBulkAction && (
            <p className="text-[9px] font-black text-[color:var(--text-sub)] uppercase tracking-widest mt-2">
              Last bulk: {lastBulkAction.status.toUpperCase()} ({lastBulkAction.count}) • {lastBulkAction.timestamp.toLocaleTimeString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-10 px-3 rounded-full border flex items-center text-[9px] font-black uppercase tracking-widest",
                isStale
                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                  : "bg-green-500/10 text-green-400 border-green-500/20"
              )}
              aria-label={isStale ? 'Live data stale' : 'Live data synced'}
            >
              {isStale ? 'STALE' : 'LIVE'}
            </span>
            <Button
              variant="outline"
              onClick={handleManualRefresh}
              className="h-10 border-white/5 text-[10px] font-black uppercase tracking-widest"
              aria-label="Refresh users"
            >
              <i className="fas fa-rotate-right mr-2" aria-hidden="true" />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="glass"
              onClick={() => {
                setShowCreateModal(true);
                setIsCreateFormDirty(false);
              }}
              className="h-10 text-[10px] font-black uppercase tracking-widest px-8 shadow-none"
              aria-label="Add new user"
            >
              <i className="fas fa-plus mr-2" aria-hidden="true" />
              Add User
            </Button>
            <Button
              variant="outline"
              className="h-10 text-[10px] font-black uppercase tracking-widest px-8 border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)] shadow-none"
              onClick={openBulkModal}
              disabled={selectedUsers.size === 0}
              aria-label={`Bulk operations for ${selectedUsers.size} selected users`}
              aria-disabled={selectedUsers.size === 0}
            >
              <i className="fas fa-users-viewfinder mr-2" aria-hidden="true" />
              Bulk Actions {selectedUsers.size > 0 && `(${selectedUsers.size})`}
            </Button>
          </div>
        </div>
      </div>



      {/* Visitor Management Card */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden mb-8">
        <CardHeader className="border-b border-white/5 px-6 py-4">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
              <i className="fas fa-id-card-clip text-white text-base" />
            </div>
            Visitor Management
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" role="group" aria-label="Visitor management actions">
            <Button
              variant="glass"
              onClick={() => navigate('/modules/visitors')}
              className="h-14 text-[10px] font-black uppercase tracking-widest border-white/5"
              aria-label="Register new visitor"
            >
              <i className="fas fa-user-plus mr-2" aria-hidden="true" />
              Add Visitor
            </Button>
            <Button
              variant="outline"
              className="h-14 text-[10px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]"
              onClick={() => navigate('/modules/visitors')}
              aria-label="Print visitor badge"
            >
              <i className="fas fa-print mr-2" aria-hidden="true" />
              Print Badge
            </Button>
            <Button
              variant="outline"
              className="h-14 text-[10px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]"
              onClick={() => navigate('/modules/visitors')}
              aria-label="Grant visitor access"
            >
              <i className="fas fa-clock-rotate-left mr-2" aria-hidden="true" />
              Grant Temporary Access
            </Button>
          </div>
          <div className="mt-4 flex items-center p-3 bg-red-500/5 border border-red-500/10 rounded-xl">
            <i className="fas fa-shield-virus text-red-400 mr-3" />
            <p className="text-[10px] text-red-300 font-bold uppercase tracking-wider">
              Banned user check active. Temporary badges expire automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Filter Component */}
      <div className="bg-slate-900/50 backdrop-blur-xl p-3 rounded-2xl border border-white/5 mb-6">
        <UsersFilter
          searchQuery={searchQuery}
          roleFilter={roleFilter}
          statusFilter={statusFilter}
          onSearchChange={setSearchQuery}
          onRoleFilterChange={setRoleFilter}
          onStatusFilterChange={setStatusFilter}
          onClearAll={handleClearAllFilters}
        />
      </div>

      {/* Users Registry */}
      <Card className="bg-slate-900/50 backdrop-blur-xl border border-white/5 shadow-2xl overflow-hidden">
        <CardHeader className="bg-white/5 border-b border-white/5 py-4">
          <CardTitle className="flex items-center justify-between text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-600/80 to-slate-900 rounded-xl flex items-center justify-center mr-3 shadow-2xl border border-white/5" aria-hidden="true">
                <i className="fas fa-fingerprint text-white text-base" />
              </div>
              Users
            </div>
            <div className="flex items-center gap-6">
              {selectedUsers.size > 0 && (
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20" aria-label={`${selectedUsers.size} users selected`}>
                  {selectedUsers.size} SELECTED
                </span>
              )}
              <span className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest opacity-50" aria-label={`Total users: ${filteredUsers.length}`}>
                TOTAL USERS: {filteredUsers.length}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 px-6 pb-6">
          <div className="flex flex-wrap gap-2 mb-8">
            {['all', 'active', 'inactive', 'suspended'].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(status as any)}
                className={cn(
                  "font-black uppercase tracking-widest text-[10px] px-6 h-9 transition-all shadow-none",
                  statusFilter === status
                    ? "bg-white/10 text-white border-white/20 hover:bg-white/15"
                    : "border-white/5 text-[color:var(--text-sub)] hover:bg-white/5 hover:text-white"
                )}
              >
                {status === 'all' ? 'All Users' : status}
              </Button>
            ))}
          </div>
          {filteredUsers.length > 0 && (
            <div className="mb-6 pb-4 border-b border-white/5 flex items-center justify-between">
              <label className="flex items-center cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers(new Set(filteredUsers.map(u => u.id)));
                    } else {
                      setSelectedUsers(new Set());
                    }
                  }}
                  className="mr-3 w-4 h-4 text-blue-600 border-white/5 rounded bg-[color:var(--console-dark)] cursor-pointer"
                  aria-label="Select all users"
                />
                <span className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest group-hover:text-blue-400 transition-colors">
                  SELECT ALL ({filteredUsers.length})
                </span>
              </label>
            </div>
          )}

          {loading.users ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="w-10 h-10 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-[0.3em] animate-pulse">Loading Users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={searchQuery || roleFilter !== 'all' || statusFilter !== 'all' ? "fas fa-user-slash" : "fas fa-users-slash"}
              title={searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? "No Users Found"
                : "No Users"}
              description={searchQuery || roleFilter !== 'all' || statusFilter !== 'all'
                ? "No users match your current filter."
                : "Add your first user to begin."}
              className="bg-black/20 border-dashed border-2 border-white/5 rounded-3xl p-12"
              action={
                !searchQuery && roleFilter === 'all' && statusFilter === 'all' ? {
                  label: 'ADD FIRST USER',
                  onClick: () => {
                    setShowCreateModal(true);
                    setIsCreateFormDirty(false);
                  },
                  variant: 'outline' as const
                } : undefined
              }
            />
          ) : (
            <div className="space-y-3" role="list" aria-label="Users list">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center justify-between p-4 bg-[color:var(--console-dark)]/20 border rounded-2xl transition-all group hover:bg-blue-500/5",
                    selectedUsers.has(user.id) ? 'border-blue-500/50 bg-blue-500/5 shadow-2xl' : 'border-white/5'
                  )}
                  role="listitem"
                >
                  <div className="flex items-center space-x-5">
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedUsers);
                        if (e.target.checked) {
                          newSelected.add(user.id);
                        } else {
                          newSelected.delete(user.id);
                        }
                        setSelectedUsers(newSelected);
                      }}
                      className="w-4 h-4 text-blue-600 border-white/5 rounded bg-[color:var(--console-dark)] cursor-pointer"
                      aria-label={`Select ${user.name}`}
                    />
                    <Avatar className="w-14 h-14 bg-gradient-to-br from-blue-600/80 to-slate-900 text-white rounded-xl shadow-2xl border border-white/5 group-hover:scale-105 transition-transform font-black text-xl" aria-label={`${user.name} avatar`}>
                      {user.avatar}
                    </Avatar>
                    <div>
                      <h4 className="font-black text-[color:var(--text-main)] text-sm uppercase tracking-tight group-hover:text-blue-400 transition-colors">{user.name}</h4>
                      <p className="text-[10px] text-[color:var(--text-sub)] font-bold uppercase tracking-widest mt-0.5 opacity-60">{user.email}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded">{user.department}</span>
                        <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">{user.role}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-end space-y-2">
                      <Badge
                        className={cn(
                          "text-[8px] font-black uppercase tracking-widest px-2",
                          user.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                            user.status === 'inactive' ? 'bg-white/5 text-[color:var(--text-sub)] border border-white/5' :
                              'bg-red-500/10 text-red-400 border border-red-500/20'
                        )}
                        size="sm"
                        aria-label={`Status: ${user.status}`}
                      >
                        {user.status.toUpperCase()}
                      </Badge>
                      <Badge className="text-[8px] font-black uppercase tracking-widest px-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" variant="outline" size="sm" aria-label={`Access level: ${user.accessLevel}`}>
                        LEVEL: {user.accessLevel.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditUser(user)}
                        className="text-[9px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-blue-400 transition-all px-4"
                        aria-label={`Edit ${user.name}`}
                      >
                        <i className="fas fa-pen-nib mr-2" aria-hidden="true" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-[9px] font-black uppercase tracking-widest border-red-500/20 text-red-400 hover:bg-red-500/10 transition-colors px-4"
                        aria-label={`Delete ${user.name}`}
                      >
                        <i className="fas fa-trash-can mr-2" aria-hidden="true" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <Modal
        isOpen={showBulkModal}
        onClose={closeBulkModal}
        title="Bulk Actions"
        size="lg"
        footer={
          <Button variant="subtle" onClick={closeBulkModal} className="text-xs font-black uppercase tracking-widest">Cancel</Button>
        }
      >
        <div className="space-y-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] italic opacity-70 text-slate-500">
            Applies to {selectedUsers.size} selected user(s)
          </p>
          {isStale && (
            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest">
              Data is stale. Refresh before running bulk updates.
            </p>
          )}
          {bulkResult && (
            <div className="p-4 bg-white/5 border border-white/5 rounded-lg">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Bulk Results: {bulkResult.successes} succeeded, {bulkResult.failures.length} failed
              </p>
              {bulkResult.failures.length > 0 && (
                <p className="text-[9px] text-red-400 font-bold uppercase tracking-widest mt-2">
                  Failed: {bulkResult.failures.join(', ')}
                </p>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="glass"
              onClick={() => handleBulkStatusUpdate('active')}
              disabled={bulkLoading || isStale}
              className="h-12 text-[10px] font-black uppercase tracking-widest border-white/5"
            >
              Activate All
            </Button>
            <Button
              variant="outline"
              onClick={() => handleBulkStatusUpdate('inactive')}
              disabled={bulkLoading || isStale}
              className="h-12 text-[10px] font-black uppercase tracking-widest border-white/5 text-[color:var(--text-sub)] hover:text-[color:var(--text-main)]"
            >
              Deactivate All
            </Button>
            <Button
              variant="glass"
              onClick={() => handleBulkStatusUpdate('suspended')}
              disabled={bulkLoading || isStale}
              className="h-12 text-[10px] font-black uppercase tracking-widest border-white/5 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 shadow-none"
            >
              Suspend All
            </Button>
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Reason (required for deactivate/suspend)</label>
            <textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500"
              placeholder="Short reason for this bulk action."
            />
          </div>
        </div>
      </Modal>

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        isFormDirty={isCreateFormDirty}
        setIsFormDirty={setIsCreateFormDirty}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={handleUpdateUser}
          user={selectedUser}
          isFormDirty={isEditFormDirty}
          setIsFormDirty={setIsEditFormDirty}
        />
      )}
    </div>
  );
};

/**
 * UsersTab with ErrorBoundary
 * Wrapped in ErrorBoundary for error isolation per Gold Standard checklist
 * Component is memoized to prevent unnecessary re-renders for heavy metrics/charts
 */
export const UsersTab: React.FC = React.memo(() => {
  return (
    <ErrorBoundary moduleName="Users Tab">
      <UsersTabComponent />
    </ErrorBoundary>
  );
});

UsersTab.displayName = 'UsersTab';
export default UsersTab;
