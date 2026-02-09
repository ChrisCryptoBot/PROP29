import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

export const UsersTab: React.FC = () => {
    const {
        filteredUsers,
        paginatedUsers,
        usersPage,
        setUsersPage,
        usersPageSize,
        setUsersPageSize,
        usersTotalPages,
        searchQuery,
        setSearchQuery,
        roleFilter,
        setRoleFilter,
        statusFilter,
        setStatusFilter,
        setShowAddUserModal,
        setShowEditUserModal,
        setSelectedUser,
        handleSuspendUser,
        handleExportUsers,
        handleBulkExportUsers,
        handleBulkSetUserStatus,
        selectedUserIds,
        setSelectedUserIds,
        showSuccess,
        showWarning
    } = useSystemAdminContext();

    const toggleUserSelection = (userId: string) => {
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };
    const toggleSelectAllOnPage = () => {
        const onPage = paginatedUsers.map(u => u.id);
        const allSelected = onPage.every(id => selectedUserIds.has(id));
        setSelectedUserIds(prev => {
            const next = new Set(prev);
            if (allSelected) onPage.forEach(id => next.delete(id));
            else onPage.forEach(id => next.add(id));
            return next;
        });
    };

    const getBadgeVariant = (variant: string) => {
        switch (variant) {
            case 'active': return 'success';
            case 'inactive': return 'destructive';
            default: return 'info';
        }
    };

    return (
        <div className="space-y-6">
            {/* User Management Header */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h2 className="page-title">User Management</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Manage platform users, roles, and permissions
                    </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <Button
                        variant="outline"
                        onClick={() => handleExportUsers()}
                        className="text-[10px] font-black uppercase tracking-widest border-white/5"
                    >
                        <i className="fas fa-download mr-2 text-slate-400" aria-hidden />
                        Export
                    </Button>
                    {selectedUserIds.size > 0 && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleBulkExportUsers}
                                className="text-[10px] font-black uppercase tracking-widest border-white/5"
                            >
                                <i className="fas fa-file-csv mr-2 text-slate-400" aria-hidden />
                                Export selected ({selectedUserIds.size})
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleBulkSetUserStatus('active')}
                                className="text-[10px] font-black uppercase tracking-widest border-emerald-500/30 text-emerald-400"
                            >
                                <i className="fas fa-user-check mr-2" aria-hidden />
                                Set active
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleBulkSetUserStatus('inactive')}
                                className="text-[10px] font-black uppercase tracking-widest border-amber-500/30 text-amber-400"
                            >
                                <i className="fas fa-user-slash mr-2" aria-hidden />
                                Set inactive
                            </Button>
                            <Button
                                variant="subtle"
                                size="sm"
                                onClick={() => setSelectedUserIds(new Set())}
                            >
                                Clear selection
                            </Button>
                        </>
                    )}
                    {selectedUserIds.size === 0 && (
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest">Select rows for bulk export or status change</span>
                    )}
                    <Button
                        onClick={() => setShowAddUserModal(true)}
                        variant="primary"
                        className="text-[10px] font-black uppercase tracking-widest px-6"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add User
                    </Button>
                </div>
            </div>

            {/* Metrics Bar */}
            <div className="flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6">
                <span className="text-slate-400 font-medium">
                    Total Users <strong className="text-white ml-1">{filteredUsers.length}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Active <strong className="text-white ml-1">{filteredUsers.filter(u => u.status === 'active').length}</strong>
                </span>
                <span className="text-slate-400 font-medium">
                    Inactive <strong className="text-white ml-1">{filteredUsers.filter(u => u.status === 'inactive').length}</strong>
                </span>
            </div>

            {/* Users Card */}
            <Card className="bg-slate-900/50 border border-white/5">
                <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center">
                            <div className="card-title-icon-box" aria-hidden="true">
                                <i className="fas fa-users text-white" />
                            </div>
                            <span className="card-title-text">User Directory</span>
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    {/* Search and Filters */}
                    <div className="p-4 border-b border-white/5">
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                            <div className="relative flex-1">
                                <SearchBar
                                    value={searchQuery}
                                    onChange={setSearchQuery}
                                    placeholder="Search users by name, email, or department..."
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={roleFilter}
                                    onChange={(e) => setRoleFilter(e.target.value)}
                                    className="px-3 py-2 border border-white/5 bg-white/5 text-[color:var(--text-main)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="user">User</option>
                                    <option value="manager">Manager</option>
                                </select>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-white/5 bg-white/5 text-[color:var(--text-main)] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                >
                                    <option value="">All Status</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Users Table */}
                    {filteredUsers.length === 0 ? (
                        <EmptyState
                            icon="fas fa-users-slash"
                            title="No Users Found"
                            description="User directory is currently empty or no users match your search criteria."
                            action={{
                                label: "Add User",
                                onClick: () => setShowAddUserModal(true)
                            }}
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3 text-left">
                                                <input
                                                    type="checkbox"
                                                    checked={paginatedUsers.length > 0 && paginatedUsers.every(u => selectedUserIds.has(u.id))}
                                                    onChange={toggleSelectAllOnPage}
                                                    aria-label="Select all on page"
                                                    className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                                                />
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">User</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Role</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Department</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Last Active</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {paginatedUsers.map((user) => (
                                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUserIds.has(user.id)}
                                                        onChange={() => toggleUserSelection(user.id)}
                                                        aria-label={`Select ${user.name}`}
                                                        className="rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="w-10 h-10 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
                                                            {user.name.charAt(0)}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-medium text-[color:var(--text-main)]">{user.name}</div>
                                                            <div className="text-sm text-[color:var(--text-sub)]">{user.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant="secondary" size="sm">
                                                        {user.role}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--text-sub)]">
                                                    {user.department || '-'}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <Badge variant={getBadgeVariant(user.status)} size="sm">
                                                        {user.status}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--text-sub)]">
                                                    {user.lastActive}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedUser(user);
                                                                setShowEditUserModal(true);
                                                            }}
                                                            className="border-white/5"
                                                            aria-label="Edit user"
                                                        >
                                                            <i className="fas fa-edit text-slate-400" aria-hidden />
                                                        </Button>
                                                        {user.status === 'active' ? (
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handleSuspendUser(user.id)}
                                                                aria-label="Suspend user"
                                                            >
                                                                <i className="fas fa-user-slash text-slate-400" aria-hidden />
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setSelectedUser({ ...user, status: 'active' });
                                                                    setShowEditUserModal(true);
                                                                }}
                                                                aria-label="Reactivate user"
                                                                className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                                            >
                                                                <i className="fas fa-user-check text-slate-400" aria-hidden />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {usersTotalPages > 1 && (
                                <div className="px-6 py-4 border-t border-white/5 bg-white/5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[10px] font-black text-[color:var(--text-sub)] uppercase tracking-widest">
                                            Showing <span className="text-[color:var(--text-main)]">{(usersPage - 1) * usersPageSize + 1}</span> to{' '}
                                            <span className="text-[color:var(--text-main)]">{Math.min(usersPage * usersPageSize, filteredUsers.length)}</span> of{' '}
                                            <span className="text-[color:var(--text-main)]">{filteredUsers.length}</span> users
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="glass"
                                                size="sm"
                                                onClick={() => setUsersPage(prev => Math.max(1, prev - 1))}
                                                disabled={usersPage === 1}
                                                className="text-[10px] font-black uppercase tracking-widest border-white/5"
                                            >
                                                <i className="fas fa-chevron-left mr-1" />
                                                Previous
                                            </Button>
                                            <div className="flex items-center gap-1">
                                                {Array.from({ length: Math.min(5, usersTotalPages) }, (_, i) => {
                                                    let pageNum: number;
                                                    if (usersTotalPages <= 5) {
                                                        pageNum = i + 1;
                                                    } else if (usersPage <= 3) {
                                                        pageNum = i + 1;
                                                    } else if (usersPage >= usersTotalPages - 2) {
                                                        pageNum = usersTotalPages - 4 + i;
                                                    } else {
                                                        pageNum = usersPage - 2 + i;
                                                    }
                                                    return (
                                                        <Button
                                                            key={pageNum}
                                                            variant={usersPage === pageNum ? 'primary' : 'glass'}
                                                            size="sm"
                                                            onClick={() => setUsersPage(pageNum)}
                                                            className="text-[10px] font-black uppercase tracking-widest min-w-[2rem]"
                                                        >
                                                            {pageNum}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                            <Button
                                                variant="glass"
                                                size="sm"
                                                onClick={() => setUsersPage(prev => Math.min(usersTotalPages, prev + 1))}
                                                disabled={usersPage === usersTotalPages}
                                                className="text-[10px] font-black uppercase tracking-widest border-white/5"
                                            >
                                                Next
                                                <i className="fas fa-chevron-right ml-1" />
                                            </Button>
                                            <select
                                                value={usersPageSize}
                                                onChange={(e) => {
                                                    setUsersPageSize(Number(e.target.value));
                                                    setUsersPage(1);
                                                }}
                                                className="text-[10px] font-black uppercase tracking-widest w-20 ml-2 bg-white/5 border border-white/5 rounded-md px-2 py-1 text-[color:var(--text-main)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                            >
                                                <option value="10">10</option>
                                                <option value="25">25</option>
                                                <option value="50">50</option>
                                                <option value="100">100</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
