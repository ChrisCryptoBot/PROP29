import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useAccountSettingsContext } from '../../context/AccountSettingsContext';
import type { TeamSettings } from '../../types/account-settings.types';

export const TeamSettingsTab: React.FC = () => {
  const { teamSettings, setTeamSettings, loading, updateTeamSettings } = useAccountSettingsContext();
  const [editMode, setEditMode] = useState(false);
  const [local, setLocal] = useState<TeamSettings>(teamSettings);

  React.useEffect(() => {
    setLocal(teamSettings);
  }, [teamSettings]);

  const handleSave = async () => {
    const ok = await updateTeamSettings(local);
    if (ok) setEditMode(false);
  };

  const handleCancel = () => {
    setLocal(teamSettings);
    setEditMode(false);
  };

  const clampNum = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  return (
    <div className="space-y-6" role="main" aria-label="Team Settings">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Team Settings</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic ">
            Working hours, break and overtime policy
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/10">
        <CardHeader className="border-b border-white/10 pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-sm font-black uppercase tracking-widest text-[color:var(--text-main)]">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/10">
                <i className="fas fa-cog text-white" aria-hidden />
              </div>
              Team Settings
            </CardTitle>
            {!editMode ? (
              <Button variant="outline" className="text-[9px] font-black uppercase tracking-widest" onClick={() => setEditMode(true)}>
                <i className="fas fa-edit mr-2" aria-hidden /> Edit Settings
              </Button>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="px-6 py-6 space-y-6">
          {editMode ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Team Name</label>
                  <input
                    type="text"
                    value={local.teamName}
                    onChange={(e) => setLocal({ ...local, teamName: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Hotel Name</label>
                  <input
                    type="text"
                    value={local.hotelName}
                    onChange={(e) => setLocal({ ...local, hotelName: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 focus:border-white/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Timezone</label>
                  <select
                    value={local.timezone}
                    onChange={(e) => setLocal({ ...local, timezone: e.target.value })}
                    className="w-full px-3 py-2 bg-[color:var(--console-dark)] border border-white/10 rounded-lg text-sm text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500/30"
                  >
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">Working Hours</label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="time"
                      value={local.workingHours.start}
                      onChange={(e) => setLocal({ ...local, workingHours: { ...local.workingHours, start: e.target.value } })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                    />
                    <span className="text-[color:var(--text-sub)]">to</span>
                    <input
                      type="time"
                      value={local.workingHours.end}
                      onChange={(e) => setLocal({ ...local, workingHours: { ...local.workingHours, end: e.target.value } })}
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white"
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 border border-white/10 rounded-lg bg-white/5">
                  <h4 className="text-sm font-black uppercase tracking-widest text-white mb-3">Break Policy</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-white mb-2">Break Duration (min)</label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={local.breakPolicy.duration}
                        onChange={(e) => setLocal({
                          ...local,
                          breakPolicy: { ...local.breakPolicy, duration: clampNum(parseInt(e.target.value, 10) || 0, 0, 60) },
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-white/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white mb-2">Frequency (hours)</label>
                      <input
                        type="number"
                        min={1}
                        max={12}
                        value={local.breakPolicy.frequency}
                        onChange={(e) => setLocal({
                          ...local,
                          breakPolicy: { ...local.breakPolicy, frequency: clampNum(parseInt(e.target.value, 10) || 1, 1, 12) },
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-white/20"
                      />
                    </div>
                  </div>
                </div>
                <div className="p-4 border border-white/10 rounded-lg bg-white/5">
                  <h4 className="text-sm font-black uppercase tracking-widest text-white mb-3">Overtime Policy</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Enable Overtime</span>
                      <input
                        type="checkbox"
                        checked={local.overtimePolicy.enabled}
                        onChange={(e) => setLocal({
                          ...local,
                          overtimePolicy: { ...local.overtimePolicy, enabled: e.target.checked },
                        })}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-white mb-2">Max Hours per Day</label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={local.overtimePolicy.maxHours}
                        onChange={(e) => setLocal({
                          ...local,
                          overtimePolicy: { ...local.overtimePolicy, maxHours: clampNum(parseInt(e.target.value, 10) || 0, 1, 24) },
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-white focus:border-white/20"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Approval Required</span>
                      <input
                        type="checkbox"
                        checked={local.overtimePolicy.approvalRequired}
                        onChange={(e) => setLocal({
                          ...local,
                          overtimePolicy: { ...local.overtimePolicy, approvalRequired: e.target.checked },
                        })}
                        className="w-5 h-5 rounded text-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button variant="primary" onClick={handleSave} disabled={loading.save}>
                  {loading.save ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Team Name</label>
                  <p className="text-white font-medium">{teamSettings.teamName}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Hotel Name</label>
                  <p className="text-white font-medium">{teamSettings.hotelName}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Timezone</label>
                  <p className="text-white font-medium">{teamSettings.timezone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Working Hours</label>
                  <p className="text-white font-medium">{teamSettings.workingHours.start} – {teamSettings.workingHours.end}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Break Policy</label>
                  <p className="text-white font-medium">{teamSettings.breakPolicy.duration} min every {teamSettings.breakPolicy.frequency} hours</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[color:var(--text-sub)] mb-1">Overtime</label>
                  <p className="text-white font-medium">
                    {teamSettings.overtimePolicy.enabled ? `Enabled (max ${teamSettings.overtimePolicy.maxHours}h/day)` : 'Disabled'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
