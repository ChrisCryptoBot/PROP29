/**
 * Work Details tab — Gold Standard (Patrol card header pattern).
 * Card header: CardTitle contains left-aligned icon+title and optional Edit button.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useProfileSettingsContext } from '../../context/ProfileSettingsContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono placeholder-slate-500';
const selectClass =
  'w-full h-10 px-4 bg-white/5 border border-white/10 rounded-md text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 appearance-none cursor-pointer';
const labelClass = 'block text-xs font-bold text-white mb-2 uppercase tracking-wider';

const DEPARTMENTS = ['Security Operations', 'Guest Services', 'Front Desk', 'Valet Services', 'Management'];
const SHIFTS = [
  { value: 'morning', label: 'Morning (6 AM - 2 PM)' },
  { value: 'afternoon', label: 'Afternoon (2 PM - 10 PM)' },
  { value: 'night', label: 'Night (10 PM - 6 AM)' },
  { value: 'rotating', label: 'Rotating' },
];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const WorkDetailsTab: React.FC = () => {
  const { profile, loading, updateProfile } = useProfileSettingsContext();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(profile);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleCancel = () => {
    setFormData(profile);
    setEditMode(false);
  };

  const handleSave = async () => {
    const updated = await updateProfile({
      department: formData.department,
      employeeId: formData.employeeId,
      hireDate: formData.hireDate,
      workSchedule: formData.workSchedule,
    });
    if (updated) setEditMode(false);
  };

  return (
    <div className="space-y-6 pt-8" role="main" aria-label="Work Details">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Work Details</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Department, shift, and work schedule
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-briefcase text-white" aria-hidden />
              </div>
              <span className="card-title-text">Work Details</span>
            </span>
            {!editMode && (
              <Button variant="outline" onClick={() => setEditMode(true)} aria-label="Edit work details">
                <i className="fas fa-edit mr-2" aria-hidden />
                Edit
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6 space-y-4">
          {editMode ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className={selectClass}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d} className="bg-slate-900 text-white">
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Employee ID</label>
                  <input
                    type="text"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Hire Date</label>
                  <input
                    type="date"
                    value={formData.hireDate}
                    onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Shift</label>
                  <select
                    value={formData.workSchedule.shift}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        workSchedule: { ...formData.workSchedule, shift: e.target.value as 'morning' | 'afternoon' | 'night' | 'rotating' },
                      })
                    }
                    className={selectClass}
                  >
                    {SHIFTS.map((s) => (
                      <option key={s.value} value={s.value} className="bg-slate-900 text-white">
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>Days Off</label>
                  <div className="flex flex-wrap gap-4">
                    {DAYS.map((day) => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.workSchedule.daysOff.includes(day)}
                          onChange={(e) => {
                            const daysOff = e.target.checked
                              ? [...formData.workSchedule.daysOff, day]
                              : formData.workSchedule.daysOff.filter((d) => d !== day);
                            setFormData({
                              ...formData,
                              workSchedule: { ...formData.workSchedule, daysOff },
                            });
                          }}
                          className="rounded border-white/20 bg-white/5 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-white">{day}</span>
                      </label>
                    ))}
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
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Department</label>
                  <p className="text-white font-medium">{profile.department || '—'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Employee ID</label>
                  <p className="text-white font-medium">{profile.employeeId || '—'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Hire Date</label>
                  <p className="text-white font-medium">
                    {profile.hireDate ? new Date(profile.hireDate).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Shift</label>
                  <p className="text-white font-medium capitalize">{profile.workSchedule?.shift?.replace('_', ' ') || '—'}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Days Off</label>
                  <p className="text-white font-medium">
                    {profile.workSchedule?.daysOff?.length ? profile.workSchedule.daysOff.join(', ') : '—'}
                  </p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Overtime Eligible</label>
                  <Badge variant={profile.workSchedule?.overtimeEligible ? 'success' : 'secondary'}>
                    {profile.workSchedule?.overtimeEligible ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
