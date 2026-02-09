/**
 * Personal Info tab — Gold Standard (Patrol card header pattern).
 * Card header: CardTitle contains left-aligned icon+title; optional Edit in same row.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useProfileSettingsContext } from '../../context/ProfileSettingsContext';
import { getRoleDisplayName, getRoleColor } from '../../types/profile-settings.types';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const labelClass = 'block text-xs font-bold text-white mb-2 uppercase tracking-wider';
const errorClass = 'text-[10px] text-red-400 font-black uppercase tracking-tight ml-1';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export const PersonalInfoTab: React.FC = () => {
  const { profile, loading, updateProfile, uploadAvatar } = useProfileSettingsContext();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [avatarUploading, setAvatarUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleCancel = () => {
    setFormData(profile);
    setErrors({});
    setEditMode(false);
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!(formData.name || '').trim()) next.name = 'Name is required';
    if (!(formData.email || '').trim()) next.email = 'Email is required';
    else if (!validateEmail(formData.email)) next.email = 'Invalid email format';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    const updated = await updateProfile({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      companyEmail: formData.companyEmail,
      employeeId: formData.employeeId,
      emergencyContact: formData.emergencyContact,
    });
    if (updated) {
      setEditMode(false);
      setErrors({});
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarUploading(true);
    try {
      await uploadAvatar(file);
    } finally {
      setAvatarUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6 pt-8" role="main" aria-label="Personal Info">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Personal Info</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Your name, contact details, and emergency contact
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardContent className="p-6">
          <div className="flex items-center space-x-6">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-md border border-white/10 overflow-hidden bg-blue-600 flex items-center justify-center"
                aria-hidden
              >
                {profile.avatar ? (
                  <img src={profile.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <i className="fas fa-user text-white text-2xl" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleAvatarChange}
                disabled={avatarUploading}
                aria-label="Upload profile picture"
              />
              {avatarUploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md">
                  <i className="fas fa-spinner fa-spin text-white" aria-hidden />
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-xl font-black text-white uppercase tracking-tight">{profile.name || 'User'}</h3>
                <Badge variant={getRoleColor(profile.role)}>{getRoleDisplayName(profile.role)}</Badge>
              </div>
              <p className="text-[color:var(--text-sub)] mb-1">{profile.email}</p>
              {profile.companyEmail && (
                <p className="text-[10px] text-slate-400 mb-0.5">Work: {profile.companyEmail}</p>
              )}
              <p className="text-[10px] font-mono text-slate-500">Employee ID: {profile.employeeId || '—'}</p>
              <p className="text-[10px] text-slate-500 mt-1">Click photo to upload a new picture</p>
            </div>
            {!editMode && (
              <Button variant="outline" onClick={() => setEditMode(true)} aria-label="Edit profile">
                <i className="fas fa-edit mr-2" aria-hidden />
                Edit Profile
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-user text-white" aria-hidden />
              </div>
              <span className="card-title-text">Personal Information</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6 space-y-4">
          {editMode ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={inputClass + (errors.name ? ' border-red-500/50' : '')}
                  />
                  {errors.name && <p className={errorClass}>{errors.name}</p>}
                </div>
                <div>
                  <label className={labelClass}>Email <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={inputClass + (errors.email ? ' border-red-500/50' : '')}
                  />
                  {errors.email && <p className={errorClass}>{errors.email}</p>}
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Company email</label>
                  <input
                    type="email"
                    value={formData.companyEmail || ''}
                    onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
                    className={inputClass}
                    placeholder="work@company.com"
                  />
                </div>
                <div>
                  <label className={labelClass}>Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId || ''}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className={inputClass}
                    placeholder="e.g. SEC-001"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Emergency Contact</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={formData.emergencyContact.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, name: e.target.value },
                        })
                      }
                      className={inputClass}
                    />
                    <input
                      type="tel"
                      placeholder="Phone"
                      value={formData.emergencyContact.phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, phone: e.target.value },
                        })
                      }
                      className={inputClass}
                    />
                    <input
                      type="text"
                      placeholder="Relationship"
                      value={formData.emergencyContact.relationship}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          emergencyContact: { ...formData.emergencyContact, relationship: e.target.value },
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="subtle" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={loading.save}>
                  {loading.save ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2" aria-hidden />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Full Name</label>
                  <p className="text-white font-medium">{profile.name || '—'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Email</label>
                  <p className="text-white font-medium">{profile.email}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Phone</label>
                  <p className="text-white font-medium">{profile.phone || '—'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Company email</label>
                  <p className="text-white font-medium">{profile.companyEmail || '—'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Employee ID</label>
                  <p className="text-white font-medium">{profile.employeeId || '—'}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Emergency Contact</label>
                  <p className="text-white font-medium">
                    {profile.emergencyContact?.name
                      ? `${profile.emergencyContact.name} (${profile.emergencyContact.relationship})`
                      : '—'}
                  </p>
                  {profile.emergencyContact?.phone && (
                    <p className="text-sm text-[color:var(--text-sub)]">{profile.emergencyContact.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
