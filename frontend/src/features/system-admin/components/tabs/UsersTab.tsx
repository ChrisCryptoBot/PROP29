import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { SearchBar } from '../../../../components/UI/SearchBar';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import { cn } from '../../../../utils/cn';

export const UsersTab: React.FC = () => {
    const {
        filteredUsers,
        searchQuery,
        setSearchQuery,
        setShowAddUserModal,
        setShowEditUserModal,
        setSelectedUser,
        showSuccess
    } = useSystemAdminContext();

    const getBadgeVariant = (variant: string) => {
        switch (variant) {
            case 'active': return 'success';
            case 'inactive': return 'destructive';
            default: return 'info';
        }
    };

    return (
        <div className="space-y-6">
            {/* User Management Header with Stats */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-[color:var(--text-main)]">User Management</h3>
                    <p className="text-[color:var(--text-sub)]">Manage platform users, roles, and permissions</p>
                </div>
                <div className="flex items-center space-x-3">
                    <Button
                        variant="outline"
                        onClick={() => showSuccess('Exporting user data')}
                    >
                        <i className="fas fa-download mr-2"></i>
                        Export
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => showSuccess('Bulk operations')}
                    >
                        <i className="fas fa-users mr-2"></i>
                        Bulk Actions
                    </Button>
                    <Button
                        onClick={() => setShowAddUserModal(true)}
                        variant="primary"
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add User
                    </Button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] shadow-sm rounded-xl p-4">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="relative flex-1">
                        <SearchBar
                            value={searchQuery}
                            onChange={setSearchQuery}
                            placeholder="Search users by name, email, or department..."
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <select className="px-3 py-2 border border-[color:var(--border-subtle)] bg-white/5 text-[color:var(--text-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                            <option value="">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                            <option value="manager">Manager</option>
                        </select>
                        <select className="px-3 py-2 border border-[color:var(--border-subtle)] bg-white/5 text-[color:var(--text-main)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-[color:var(--surface-card)] border-[1.5px] border-[color:var(--border-subtle)] shadow-sm rounded-xl overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <EmptyState
                        icon="fas fa-users-slash"
                        title="No Users Found"
                        description="User directory is currently empty. Add your first administrative or staff user to begin."
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Last Active</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-[color:var(--text-sub)] uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20">
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
                                                {user.department}
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
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedUser(user);
                                                            setShowEditUserModal(true);
                                                        }}
                                                    >
                                                        <i className="fas fa-edit" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => showSuccess(`Suspended user ${user.name}`)}
                                                    >
                                                        <i className="fas fa-user-slash" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Placeholder */}
                        <div className="px-6 py-4 border-t border-white/5 bg-white/5">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-[color:var(--text-sub)]">
                                    Showing <span className="font-medium text-[color:var(--text-main)]">1</span> to <span className="font-medium text-[color:var(--text-main)]">{filteredUsers.length}</span> of <span className="font-medium text-[color:var(--text-main)]">{filteredUsers.length}</span> users
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Button size="sm" variant="glass" className="text-[color:var(--text-sub)] border-white/5" disabled>Previous</Button>
                                    <Button size="sm" variant="primary">1</Button>
                                    <Button size="sm" variant="glass" className="text-[color:var(--text-sub)] border-white/5" disabled>Next</Button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};


