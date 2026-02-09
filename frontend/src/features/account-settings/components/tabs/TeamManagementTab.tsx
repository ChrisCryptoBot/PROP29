import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useAccountSettingsContext } from '../../context/AccountSettingsContext';
import { getRoleDisplayName, getRoleColor, getStatusColor } from '../../types/account-settings.types';
import type { TeamMember } from '../../types/account-settings.types';

interface TeamManagementTabProps {
  onAddMember: () => void;
  onEditMember: (member: TeamMember) => void;
  onRemoveMember: (member: TeamMember) => void;
}

export const TeamManagementTab: React.FC<TeamManagementTabProps> = ({ onAddMember, onEditMember, onRemoveMember }) => {
  const navigate = useNavigate();
  const { teamMembers, loading } = useAccountSettingsContext();
  const activeCount = teamMembers.filter((m) => m.status === 'active').length;
  const pendingCount = teamMembers.filter((m) => m.status === 'pending').length;
  const departmentCount = new Set(teamMembers.map((m) => m.department)).size;

  const handleView = (member: TeamMember) => {
    navigate('/profile', { state: { userId: member.id, from: 'account-settings' } });
  };

  if (loading.team && teamMembers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading team members">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading team members...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" role="main" aria-label="Team Management">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Team Management</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic ">
            Manage team members and roles
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 py-3 border-b border-white/10 text-sm mb-6">
        <span className="text-[color:var(--text-sub)] font-medium">Total Members <strong className="text-white ml-1">{teamMembers.length}</strong></span>
        <span className="text-[color:var(--text-sub)] font-medium">Active <strong className="text-white ml-1">{activeCount}</strong></span>
        <span className="text-[color:var(--text-sub)] font-medium">Pending <strong className="text-white ml-1">{pendingCount}</strong></span>
        <span className="text-[color:var(--text-sub)] font-medium">Departments <strong className="text-white ml-1">{departmentCount}</strong></span>
      </div>

      <Card className="bg-slate-900/50 border border-white/10">
        <CardHeader className="border-b border-white/10 pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm font-black uppercase tracking-widest text-[color:var(--text-main)]">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/10">
                <i className="fas fa-users text-white" aria-hidden />
              </div>
              Team Members
            </CardTitle>
            <Button variant="glass" className="text-[9px] font-black uppercase tracking-widest" onClick={onAddMember}>
              <i className="fas fa-plus mr-2" aria-hidden /> Add Member
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {teamMembers.length === 0 ? (
            <EmptyState
              icon="fas fa-users-slash"
              title="No team members"
              description="Add your first team member to get started."
              action={{ label: 'Add Member', onClick: onAddMember, variant: 'primary' }}
              className="bg-black/20 border-dashed border-2 border-white/10 rounded-lg p-12"
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full" aria-label="Team members">
                <thead className="bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Member</th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Role</th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Department</th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Status</th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Last Active</th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-slate-700 border border-white/10 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                            {member.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="ml-4">
                            <div className="text-[10px] font-black uppercase tracking-widest text-[color:var(--text-main)]">{member.name}</div>
                            <div className="text-sm text-[color:var(--text-sub)]">{member.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getRoleColor(member.role) as 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'}>
                          {getRoleDisplayName(member.role)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--text-sub)]">{member.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getStatusColor(member.status) as 'default' | 'success' | 'warning' | 'destructive'}>
                          {member.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[color:var(--text-sub)]">
                        {new Date(member.lastActive).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleView(member)} aria-label={`View ${member.name} profile`}>
                            <i className="fas fa-eye" aria-hidden />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onEditMember(member)} aria-label={`Edit ${member.name}`}>
                            <i className="fas fa-edit" aria-hidden />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => onRemoveMember(member)} aria-label={`Remove ${member.name} from team`}>
                            <i className="fas fa-trash" aria-hidden />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
