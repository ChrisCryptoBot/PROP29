/**
 * SettingsTab Component
 * 
 * Tab for managing handover settings, templates, and configurations.
 * Uses the useHandoverSettings hook for data management.
 */

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { useHandoverSettings, useHandoverTemplates } from '../../hooks';
import { showSuccess, showError } from '../../../../utils/toast';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { ChecklistTemplateModal, type CreateTemplateData } from '../modals/ChecklistTemplateModal';
import type { ChecklistTemplate } from '../../types';

export interface SettingsTabProps {
  // Add any additional props if needed
}

/**
 * Settings Tab Component
 */
export const SettingsTab: React.FC<SettingsTabProps> = () => {
  const { settings, updateSettings, loading } = useHandoverSettings();
  const { templates, loading: templatesLoading, createTemplate, updateTemplate, deleteTemplate } = useHandoverTemplates();

  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ChecklistTemplate | undefined>();

  const handleSettingsChange = async (key: string, value: any) => {
    try {
      await updateSettings({ [key]: value } as any);
      showSuccess('Settings updated successfully');
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const handleNotificationToggle = async (key: string, value: boolean) => {
    await handleSettingsChange('notificationSettings', {
      ...settings?.notificationSettings,
      [key]: value,
    });
  };

  const handleShiftTimeChange = async (shift: string, timeType: 'start' | 'end', value: string) => {
    await handleSettingsChange('shiftConfigurations', {
      ...settings?.shiftConfigurations,
      [shift]: {
        ...settings?.shiftConfigurations[shift as keyof typeof settings.shiftConfigurations],
        [timeType]: value,
      },
    });
  };

  const handleAddTemplate = () => {
    setEditingTemplate(undefined);
    setShowTemplateModal(true);
  };

  const handleEditTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setEditingTemplate(template);
      setShowTemplateModal(true);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await deleteTemplate(templateId);
      showSuccess('Template deleted successfully');
    } catch (error) {
      console.error('Failed to delete template:', error);
      showError('Failed to delete template');
    }
  };

  const handleTemplateSubmit = async (data: CreateTemplateData) => {
    try {
      if (editingTemplate) {
        await updateTemplate(editingTemplate.id, {
          ...data,
          items: data.items.map((item, index) => ({ ...item, order: index })),
        });
        showSuccess('Template updated successfully');
      } else {
        await createTemplate({
          ...data,
          items: data.items.map((item, index) => ({ ...item, order: index })),
        });
        showSuccess('Template created successfully');
      }
      setShowTemplateModal(false);
      setEditingTemplate(undefined);
    } catch (error) {
      console.error('Failed to save template:', error);
      throw error;
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-slate-400 mb-4" />
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Shift Configuration */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-700 to-blue-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-clock text-white text-sm" />
            </div>
            Shift Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { shift: 'morning', label: 'Morning', icon: 'fa-sun', start: '06:00', end: '14:00' },
              { shift: 'afternoon', label: 'Afternoon', icon: 'fa-cloud-sun', start: '14:00', end: '22:00' },
              { shift: 'night', label: 'Night', icon: 'fa-moon', start: '22:00', end: '06:00' },
            ].map((config) => {
              const shiftConfig =
                settings?.shiftConfigurations?.[config.shift as keyof typeof settings.shiftConfigurations] || {
                  start: config.start,
                  end: config.end,
                };

              return (
                <div key={config.shift} className="p-4 border border-[color:var(--border-subtle)]/30 rounded-lg bg-[color:var(--background-base)]/30">
                  <div className="flex items-center space-x-2 mb-3">
                    <i className={`fas ${config.icon} text-[color:var(--text-sub)]`} />
                    <h4 className="font-bold text-[color:var(--text-main)]">{config.label} Shift</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-[color:var(--text-sub)] uppercase tracking-wider font-bold">Start Time</label>
                      <input
                        type="time"
                        value={shiftConfig.start || config.start}
                        onChange={(e) => handleShiftTimeChange(config.shift, 'start', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-[color:var(--background-base)] border border-[color:var(--border-subtle)]/50 rounded-lg text-sm text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[color:var(--text-sub)] uppercase tracking-wider font-bold">End Time</label>
                      <input
                        type="time"
                        value={shiftConfig.end || config.end}
                        onChange={(e) => handleShiftTimeChange(config.shift, 'end', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-[color:var(--background-base)] border border-[color:var(--border-subtle)]/50 rounded-lg text-sm text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Checklist Templates */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-700 to-purple-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                <i className="fas fa-list-check text-white text-sm" />
              </div>
              Checklist Templates
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddTemplate} className="border-purple-500/30 hover:bg-purple-500/10 text-purple-400">
              <i className="fas fa-plus mr-1" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          {templatesLoading ? (
            <div className="text-center py-8 text-[color:var(--text-sub)]">
              <i className="fas fa-spinner fa-spin text-2xl mb-3" />
              <p>Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <EmptyState
              icon="fas fa-list-check"
              title="No templates found"
              description="Create a checklist template to standardize handover tasks."
              action={{
                label: "ADD TEMPLATE",
                onClick: handleAddTemplate,
                variant: "outline"
              }}
            />
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="p-4 border border-[color:var(--border-subtle)]/30 rounded-lg flex items-center justify-between bg-[color:var(--background-base)]/30 hover:bg-[color:var(--background-base)]/50 transition-colors"
                >
                  <div>
                    <h4 className="font-bold text-[color:var(--text-main)]">{template.name}</h4>
                    <p className="text-sm text-[color:var(--text-sub)]">
                      {template.items?.length || 0} items • {template.category || 'General'}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditTemplate(template.id)}
                      className="border-[color:var(--border-subtle)]/30 hover:bg-[color:var(--surface-highlight)] text-[color:var(--text-sub)]"
                    >
                      <i className="fas fa-edit" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="border-red-500/30 hover:bg-red-500/10 text-red-500"
                    >
                      <i className="fas fa-trash" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-700 to-amber-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-bell text-white text-sm" />
            </div>
            Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6 space-y-4">
          {[
            { label: 'Email notifications for new handovers', key: 'emailNotifications' },
            { label: 'SMS alerts for overdue handovers', key: 'smsNotifications' },
            { label: 'Push notifications for handover updates', key: 'pushNotifications' },
            { label: 'Daily handover summary reports', key: 'dailyReports' },
            { label: 'Notify on checklist completion', key: 'checklistNotifications' },
          ].map((setting) => {
            const value =
              (settings?.notificationSettings?.[setting.key as keyof typeof settings.notificationSettings] as boolean) ||
              false;

            return (
              <div key={setting.key} className="flex items-center justify-between p-3 rounded-lg hover:bg-[color:var(--background-base)]/30 transition-colors">
                <span className="text-[color:var(--text-main)] font-medium">{setting.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    className="sr-only peer"
                    onChange={(e) => handleNotificationToggle(setting.key, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Auto-Handover Rules */}
      <Card className="bg-[color:var(--surface-card)] border border-[color:var(--border-subtle)]/50 shadow-2xl">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[color:var(--border-subtle)]/10">
          <CardTitle className="flex items-center text-xl text-[color:var(--text-main)] font-black uppercase tracking-tighter">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-700 to-emerald-900 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <i className="fas fa-magic text-white text-sm" />
            </div>
            Auto-Handover Rules
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6 space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <i className="fas fa-robot text-blue-400" />
                <h4 className="font-bold text-blue-100">Automatic Handover Creation</h4>
              </div>
              <span className="px-2.5 py-1 text-xs font-black rounded text-blue-300 bg-blue-500/20 border border-blue-500/30 uppercase tracking-wider">Active</span>
            </div>
            <p className="text-sm text-[color:var(--text-sub)] mb-3">
              Automatically create handovers {settings?.notificationSettings?.reminderTime || 30} minutes before shift
              change
            </p>
            <div className="space-y-2">
              <label className="text-xs text-[color:var(--text-sub)] uppercase tracking-wider font-bold">Lead Time (minutes)</label>
              <input
                type="number"
                defaultValue={settings?.notificationSettings?.reminderTime || '30'}
                className="w-full px-3 py-2 bg-[color:var(--background-base)] border border-[color:var(--border-subtle)]/50 rounded-lg text-sm text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) =>
                  handleSettingsChange('notificationSettings', {
                    ...settings?.notificationSettings,
                    reminderTime: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <i className="fas fa-exclamation-triangle text-amber-400" />
                <h4 className="font-bold text-amber-100">Overdue Reminders</h4>
              </div>
              <Badge variant="warning">Active</Badge>
            </div>
            <p className="text-sm text-[color:var(--text-sub)] mb-3">
              Send reminders for incomplete handovers after {settings?.notificationSettings?.escalationTime || 2} hours
            </p>
            <div className="space-y-2">
              <label className="text-xs text-[color:var(--text-sub)] uppercase tracking-wider font-bold">Reminder Interval (hours)</label>
              <input
                type="number"
                defaultValue={settings?.notificationSettings?.escalationTime || '2'}
                className="w-full px-3 py-2 bg-[color:var(--background-base)] border border-[color:var(--border-subtle)]/50 rounded-lg text-sm text-[color:var(--text-main)] focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                onChange={(e) =>
                  handleSettingsChange('notificationSettings', {
                    ...settings?.notificationSettings,
                    escalationTime: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Modal */}
      <ChecklistTemplateModal
        isOpen={showTemplateModal}
        onClose={() => {
          setShowTemplateModal(false);
          setEditingTemplate(undefined);
        }}
        onSubmit={handleTemplateSubmit}
        initialData={editingTemplate}
        mode={editingTemplate ? 'edit' : 'create'}
      />
    </div>
  );
};




