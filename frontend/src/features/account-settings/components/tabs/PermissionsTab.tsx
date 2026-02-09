import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useAccountSettingsContext } from '../../context/AccountSettingsContext';
import { getRoleColor, getRoleDisplayName, PERMISSION_LIST } from '../../types/account-settings.types';
import { showInfo } from '../../../../utils/toast';

const ROLES: Array<{ id: string; label: string }> = [
  { id: 'director', label: 'Security Director' },
  { id: 'manager', label: 'Security Manager' },
  { id: 'patrol_agent', label: 'Patrol Agent' },
  { id: 'valet', label: 'Valet Staff' },
  { id: 'front_desk', label: 'Front Desk Staff' },
];

export const PermissionsTab: React.FC = () => {
  const { teamMembers, rolePermissions } = useAccountSettingsContext();

  const handleEditPermissions = (roleLabel: string) => {
    showInfo(`Edit permissions for ${roleLabel} is available. Use the Save button in the role section when editable permissions are implemented.`);
  };

  const getRolePermissionSet = (role: string): Set<string> => {
    const r = rolePermissions[role];
    if (Array.isArray(r)) return new Set(r);
    if (role === 'director') return new Set(PERMISSION_LIST);
    if (role === 'manager') return new Set(['view_dashboard', 'manage_incidents', 'view_reports', 'assign_tasks']);
    return new Set();
  };

  return (
    <div className="space-y-6" role="main" aria-label="Role Permissions">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Role Permissions</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic ">
            View and manage permissions by role
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/10">
        <CardHeader className="border-b border-white/10 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center text-sm font-black uppercase tracking-widest text-[color:var(--text-main)]">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/10">
              <i className="fas fa-shield-alt text-white" aria-hidden />
            </div>
            Role Permissions
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          <div className="space-y-6">
            {ROLES.map(({ id, label }) => {
              const perms = getRolePermissionSet(id);
              const memberCount = teamMembers.filter((m) => m.role === id).length;
              return (
                <div key={id} className="p-4 rounded-lg border border-white/10 bg-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Badge variant={getRoleColor(id) as 'destructive' | 'warning' | 'success' | 'default' | 'secondary'}>
                        {label}
                      </Badge>
                      <span className="text-sm text-[color:var(--text-sub)]">{memberCount} members</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => handleEditPermissions(label)} aria-label={`Edit permissions for ${label}`}>
                      <i className="fas fa-edit mr-1" aria-hidden /> Edit Permissions
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {PERMISSION_LIST.map((perm) => (
                      <div key={perm} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={perms.has(perm)}
                          readOnly
                          className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600"
                          aria-label={`${perm} ${perms.has(perm) ? 'enabled' : 'disabled'}`}
                        />
                        <span className="text-sm text-slate-300 capitalize">{perm.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
