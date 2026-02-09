/**
 * Preferences tab — Gold Standard (Patrol card header pattern).
 * CardTitle contains left-aligned icon+title and optional Edit button.
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { useProfileSettingsContext } from '../../context/ProfileSettingsContext';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/10 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 font-mono';
const selectClass =
  'w-full h-10 px-4 bg-white/5 border border-white/10 rounded-md text-sm text-white outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 appearance-none cursor-pointer';
const labelClass = 'block text-xs font-bold text-white mb-2 uppercase tracking-wider';

const LANGUAGE_LABELS: Record<string, string> = { en: 'English', es: 'Spanish', fr: 'French' };
const TIMEZONE_LABELS: Record<string, string> = {
  'America/New_York': 'Eastern Time',
  'America/Chicago': 'Central Time',
  'America/Denver': 'Mountain Time',
  'America/Los_Angeles': 'Pacific Time',
  UTC: 'UTC',
};

export const PreferencesTab: React.FC = () => {
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
    const updated = await updateProfile({ preferences: formData.preferences });
    if (updated) setEditMode(false);
  };

  const prefs = profile.preferences || { language: 'en', timezone: 'America/New_York', dateFormat: 'MM/DD/YYYY', theme: 'dark' };

  return (
    <div className="space-y-6 pt-8" role="main" aria-label="Preferences">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Preferences</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Language, timezone, date format, and theme
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-cog text-white" aria-hidden />
              </div>
              <span className="card-title-text">Preferences</span>
            </span>
            {!editMode && (
              <Button variant="outline" onClick={() => setEditMode(true)} aria-label="Edit preferences">
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
                  <label className={labelClass}>Language</label>
                  <select
                    value={formData.preferences.language}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, language: e.target.value },
                      })
                    }
                    className={selectClass}
                  >
                    <option value="en" className="bg-slate-900 text-white">English</option>
                    <option value="es" className="bg-slate-900 text-white">Spanish</option>
                    <option value="fr" className="bg-slate-900 text-white">French</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Timezone</label>
                  <select
                    value={formData.preferences.timezone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, timezone: e.target.value },
                      })
                    }
                    className={selectClass}
                  >
                    {Object.entries(TIMEZONE_LABELS).map(([value, label]) => (
                      <option key={value} value={value} className="bg-slate-900 text-white">
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date Format</label>
                  <select
                    value={formData.preferences.dateFormat}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, dateFormat: e.target.value },
                      })
                    }
                    className={selectClass}
                  >
                    <option value="MM/DD/YYYY" className="bg-slate-900 text-white">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY" className="bg-slate-900 text-white">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD" className="bg-slate-900 text-white">YYYY-MM-DD</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Theme</label>
                  <select
                    value={formData.preferences.theme}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        preferences: { ...formData.preferences, theme: e.target.value as 'light' | 'dark' | 'auto' },
                      })
                    }
                    className={selectClass}
                  >
                    <option value="light" className="bg-slate-900 text-white">Light</option>
                    <option value="dark" className="bg-slate-900 text-white">Dark</option>
                    <option value="auto" className="bg-slate-900 text-white">Auto</option>
                  </select>
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
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Language</label>
                  <p className="text-white font-medium">{LANGUAGE_LABELS[prefs.language] || prefs.language}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Timezone</label>
                  <p className="text-white font-medium">{TIMEZONE_LABELS[prefs.timezone] || prefs.timezone}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Date Format</label>
                  <p className="text-white font-medium">{prefs.dateFormat}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Theme</label>
                  <p className="text-white font-medium capitalize">{prefs.theme}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
