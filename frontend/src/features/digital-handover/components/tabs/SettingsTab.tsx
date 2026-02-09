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
import { ErrorHandlerService } from '../../../../services/ErrorHandlerService';
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
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'DigitalHandover:handleSettingsChange');
      showError('Failed to update settings');
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
      ErrorHandlerService.logError(error instanceof Error ? error : new Error(String(error)), 'DigitalHandover:handleDeleteTemplate');
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
    } catch (e) {
      throw e;
    }
  };

  if (loading && !settings) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4" role="status" aria-label="Loading settings">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Settings</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Handover configuration and templates
          </p>
        </div>
      </div>

      {/* Shift Configuration */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="card-title-icon-box" aria-hidden="true">
              <i className="fas fa-clock text-white" />
            </div>
            <span className="card-title-text">Shift Configuration</span>
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
                <div key={config.shift} className="p-4 border border-white/5 rounded-md bg-white/5">
                  <div className="flex items-center space-x-2 mb-3">
                    <i className={`fas ${config.icon} text-[color:var(--text-sub)]`} />
                    <h4 className="font-black text-[color:var(--text-main)] text-sm uppercase tracking-widest">{config.label} Shift</h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <label className="text-xs text-[color:var(--text-sub)] uppercase tracking-wider font-bold">Start Time</label>
                      <input
                        type="time"
                        value={shiftConfig.start || config.start}
                        onChange={(e) => handleShiftTimeChange(config.shift, 'start', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-[color:var(--background-base)] border border-white/10 rounded-md text-sm text-[color:var(--text-main)] focus:outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[color:var(--text-sub)] uppercase tracking-wider font-bold">End Time</label>
                      <input
                        type="time"
                        value={shiftConfig.end || config.end}
                        onChange={(e) => handleShiftTimeChange(config.shift, 'end', e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-[color:var(--background-base)] border border-white/10 rounded-md text-sm text-[color:var(--text-main)] focus:outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <div className="card-title-icon-box" aria-hidden="true">
                <i className="fas fa-list-check text-white" />
              </div>
              <span className="card-title-text">Checklist Templates</span>
            </CardTitle>
            <Button size="sm" variant="outline" onClick={handleAddTemplate} className="border-white/10 hover:bg-white/10 text-white">
              <i className="fas fa-plus mr-1" />
              Add Template
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6">
          {templatesLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4" role="status" aria-label="Loading templates">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest animate-pulse">Loading templates...</p>
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
                  className="p-4 border border-white/5 rounded-lg flex items-center justify-between bg-white/5 hover:bg-white/10 transition-colors"
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
                      className="border-white/5 hover:bg-white/5 text-[color:var(--text-sub)]"
                      aria-label={`Edit template ${template.name}`}
                    >
                      <i className="fas fa-edit" aria-hidden />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="border-red-500/30 hover:bg-red-500/10 text-red-500"
                      aria-label={`Delete template ${template.name}`}
                    >
                      <i className="fas fa-trash" aria-hidden />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="card-title-icon-box" aria-hidden="true">
              <i className="fas fa-bell text-white" />
            </div>
            <span className="card-title-text">Notification Settings</span>
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
              <div key={setting.key} className="flex items-center justify-between p-3 rounded-md hover:bg-white/5 transition-colors">
                <span className="text-[color:var(--text-main)] font-black text-sm uppercase tracking-wider">{setting.label}</span>
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
      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="card-title-icon-box" aria-hidden="true">
              <i className="fas fa-magic text-white" />
            </div>
            <span className="card-title-text">Auto-Handover Rules</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-6 space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <i className="fas fa-robot text-blue-400" />
                <h4 className="font-black text-blue-100 text-sm uppercase tracking-widest">Automatic Handover Creation</h4>
              </div>
              <span className="px-2.5 py-1 text-xs font-black rounded-md text-blue-300 bg-blue-500/20 border border-blue-500/30 uppercase tracking-wider">Active</span>
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
                className="w-full px-3 py-2 bg-[color:var(--background-base)] border border-white/10 rounded-md text-sm text-[color:var(--text-main)] focus:outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onChange={(e) =>
                  handleSettingsChange('notificationSettings', {
                    ...settings?.notificationSettings,
                    reminderTime: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-md">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <i className="fas fa-exclamation-triangle text-amber-400" />
                <h4 className="font-black text-amber-100 text-sm uppercase tracking-widest">Overdue Reminders</h4>
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
                className="w-full px-3 py-2 bg-[color:var(--background-base)] border border-white/10 rounded-md text-sm text-[color:var(--text-main)] focus:outline focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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




