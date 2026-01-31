import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { useIncidentLogContext } from '../../context/IncidentLogContext';
import { AgentSettings, IncidentType, IncidentSeverity, AgentTrustLevel } from '../../types/incident-log.types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { cn } from '../../../../utils/cn';

interface AutoApprovalRule {
    id: string;
    name: string;
    enabled: boolean;
    priority: number;
    conditions: {
        trustScoreMin: number;
        trustScoreMax: number;
        incidentTypes: IncidentType[];
        severityLevels: IncidentSeverity[];
        maxResponseTimeMinutes?: number;
        requiresEvidence?: boolean;
        agentIds?: string[];
    };
    actions: {
        autoApprove: boolean;
        requireManagerReview: boolean;
        notifyManagers: boolean;
        flagForAudit: boolean;
    };
    description: string;
}

interface AutoApprovalSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const DEFAULT_RULES: AutoApprovalRule[] = [
    {
        id: 'high-trust-low-severity',
        name: 'High Trust - Low Severity',
        enabled: true,
        priority: 1,
        conditions: {
            trustScoreMin: 80,
            trustScoreMax: 100,
            incidentTypes: [IncidentType.GUEST_COMPLAINT, IncidentType.OTHER],
            severityLevels: [IncidentSeverity.LOW, IncidentSeverity.MEDIUM],
            maxResponseTimeMinutes: 30
        },
        actions: {
            autoApprove: true,
            requireManagerReview: false,
            notifyManagers: false,
            flagForAudit: false
        },
        description: 'Auto-approve low-medium severity incidents from high-trust agents'
    },
    {
        id: 'medium-trust-low-only',
        name: 'Medium Trust - Low Severity Only',
        enabled: true,
        priority: 2,
        conditions: {
            trustScoreMin: 50,
            trustScoreMax: 79,
            incidentTypes: [IncidentType.GUEST_COMPLAINT, IncidentType.OTHER],
            severityLevels: [IncidentSeverity.LOW],
            requiresEvidence: false
        },
        actions: {
            autoApprove: true,
            requireManagerReview: false,
            notifyManagers: true,
            flagForAudit: false
        },
        description: 'Auto-approve only low severity, non-critical incidents from medium-trust agents'
    },
    {
        id: 'high-trust-critical-review',
        name: 'High Trust - Critical Review',
        enabled: true,
        priority: 3,
        conditions: {
            trustScoreMin: 80,
            trustScoreMax: 100,
            incidentTypes: [IncidentType.FIRE, IncidentType.MEDICAL, IncidentType.THEFT, IncidentType.CYBER],
            severityLevels: [IncidentSeverity.HIGH, IncidentSeverity.CRITICAL]
        },
        actions: {
            autoApprove: false,
            requireManagerReview: true,
            notifyManagers: true,
            flagForAudit: true
        },
        description: 'Require manager review for high-severity incidents even from trusted agents'
    }
];

export const AutoApprovalSettingsModal: React.FC<AutoApprovalSettingsModalProps> = ({
    isOpen,
    onClose
}) => {
    const { 
        enhancedSettings,
        updateEnhancedSettings,
        agentPerformanceMetrics,
        loading
    } = useIncidentLogContext();

    const [activeTab, setActiveTab] = useState<'rules' | 'thresholds' | 'advanced' | 'testing'>('rules');
    const [rules, setRules] = useState<AutoApprovalRule[]>(DEFAULT_RULES);
    const [editingRule, setEditingRule] = useState<AutoApprovalRule | null>(null);
    const [isCreatingRule, setIsCreatingRule] = useState(false);
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
    
    // Global settings
    const [globalSettings, setGlobalSettings] = useState({
        enabled: false,
        defaultTrustThreshold: 80,
        maxBulkSize: 50,
        auditAllApprovals: false,
        timeoutMinutes: 60,
        allowOverrides: true
    });

    // Load settings on modal open
    useEffect(() => {
        if (isOpen && enhancedSettings?.agent_settings) {
            const settings = enhancedSettings.agent_settings;
            setGlobalSettings({
                enabled: settings.auto_approval_enabled,
                defaultTrustThreshold: settings.auto_approval_threshold,
                maxBulkSize: 50, // Default
                auditAllApprovals: false, // Default
                timeoutMinutes: 60, // Default
                allowOverrides: true // Default
            });
        }
    }, [isOpen, enhancedSettings]);

    // Rule management functions
    const handleAddRule = () => {
        const newRule: AutoApprovalRule = {
            id: `rule-${Date.now()}`,
            name: 'New Rule',
            enabled: false,
            priority: rules.length + 1,
            conditions: {
                trustScoreMin: 50,
                trustScoreMax: 100,
                incidentTypes: [],
                severityLevels: []
            },
            actions: {
                autoApprove: false,
                requireManagerReview: true,
                notifyManagers: false,
                flagForAudit: false
            },
            description: ''
        };
        setEditingRule(newRule);
        setIsCreatingRule(true);
    };

    const handleSaveRule = (rule: AutoApprovalRule) => {
        if (isCreatingRule) {
            setRules(prev => [...prev, rule]);
        } else {
            setRules(prev => prev.map(r => r.id === rule.id ? rule : r));
        }
        setEditingRule(null);
        setIsCreatingRule(false);
    };

    const handleDeleteRule = (ruleId: string) => {
        setRuleToDelete(ruleId);
        setShowDeleteConfirmModal(true);
    };

    const confirmDeleteRule = () => {
        if (ruleToDelete) {
            setRules(prev => prev.filter(r => r.id !== ruleToDelete));
            setRuleToDelete(null);
            setShowDeleteConfirmModal(false);
        }
    };

    const handleToggleRule = (ruleId: string) => {
        setRules(prev => prev.map(r => 
            r.id === ruleId ? { ...r, enabled: !r.enabled } : r
        ));
    };

    // Test rule against agent data
    const testRule = (rule: AutoApprovalRule) => {
        const applicableAgents = agentPerformanceMetrics.filter(agent => {
            const meetsMinTrust = agent.trust_score >= rule.conditions.trustScoreMin;
            const meetMaxTrust = agent.trust_score <= rule.conditions.trustScoreMax;
            const hasSpecificAgent = !rule.conditions.agentIds || rule.conditions.agentIds.includes(agent.agent_id);
            
            return meetsMinTrust && meetMaxTrust && hasSpecificAgent;
        });

        return {
            applicableAgents: applicableAgents.length,
            totalAgents: agentPerformanceMetrics.length,
            coverage: agentPerformanceMetrics.length > 0 
                ? Math.round((applicableAgents.length / agentPerformanceMetrics.length) * 100)
                : 0
        };
    };

    const handleSave = async () => {
        if (!enhancedSettings) return;

        const updatedSettings = {
            ...enhancedSettings,
            agent_settings: {
                ...enhancedSettings.agent_settings!,
                auto_approval_enabled: globalSettings.enabled,
                auto_approval_threshold: globalSettings.defaultTrustThreshold,
                bulk_approval_enabled: true, // Keep existing setting
                // Store rules in notification_preferences for now (would need backend changes for proper storage)
                notification_preferences: {
                    email_low_trust_alerts: enhancedSettings.agent_settings?.notification_preferences?.email_low_trust_alerts ?? true,
                    email_bulk_operation_results: enhancedSettings.agent_settings?.notification_preferences?.email_bulk_operation_results ?? false,
                    email_agent_performance_reports: enhancedSettings.agent_settings?.notification_preferences?.email_agent_performance_reports ?? true,
                    custom_rules: JSON.stringify(rules.filter(r => r.enabled))
                }
            }
        };

        const success = await updateEnhancedSettings(updatedSettings);
        if (success) {
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title="Auto-Approval Settings"
            size="xl"
            footer={(
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center space-x-4">
                        <span className={cn(
                            "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border",
                            globalSettings.enabled
                                ? "text-green-300 bg-green-500/20 border-green-500/30"
                                : "text-slate-300 bg-slate-500/20 border-slate-500/30"
                        )}>
                            <i className={cn("fas mr-1", globalSettings.enabled ? "fa-check" : "fa-times")} />
                            Auto-Approval {globalSettings.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <span className="text-sm text-slate-400">
                            {rules.filter(r => r.enabled).length} active rules
                        </span>
                    </div>
                    <div className="flex space-x-3">
                        <Button variant="subtle" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button 
                            variant="glass" 
                            onClick={handleSave}
                            disabled={loading.settings}
                        >
                            <i className="fas fa-save mr-2" />
                            Save Settings
                        </Button>
                    </div>
                </div>
            )}
        >
            <div className="space-y-6">
                {/* Tab Navigation */}
                <div className="flex space-x-1 p-1 bg-white/5 rounded-lg border border-white/5">
                    {[
                        { key: 'rules', label: 'Rules', icon: 'fa-list' },
                        { key: 'thresholds', label: 'Thresholds', icon: 'fa-sliders-h' },
                        { key: 'advanced', label: 'Advanced', icon: 'fa-cogs' },
                        { key: 'testing', label: 'Testing', icon: 'fa-vial' }
                    ].map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key as any)}
                            className={cn(
                                "flex-1 flex items-center justify-center px-4 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-all",
                                activeTab === tab.key
                                    ? "text-white bg-white/10 shadow-lg"
                                    : "text-slate-400 hover:text-white hover:bg-white/5"
                            )}
                        >
                            <i className={cn("fas mr-2", tab.icon)} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Rules Tab */}
                {activeTab === 'rules' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-bold text-white">Approval Rules</h3>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={handleAddRule}
                                className="border-green-500/30 text-green-300 hover:bg-green-500/10"
                            >
                                <i className="fas fa-plus mr-2" />
                                Add Rule
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {rules.map((rule, index) => (
                                <Card key={rule.id} className="glass-card border border-white/5">
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <button
                                                            onClick={() => handleToggleRule(rule.id)}
                                                            className={cn(
                                                                "w-10 h-6 rounded-full border-2 transition-all relative",
                                                                rule.enabled 
                                                                    ? "bg-green-500 border-green-500" 
                                                                    : "bg-slate-600 border-slate-500"
                                                            )}
                                                        >
                                                            <div className={cn(
                                                                "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all",
                                                                rule.enabled ? "right-0.5" : "left-0.5"
                                                            )} />
                                                        </button>
                                                        <span className={cn(
                                                            "text-xs font-bold px-2 py-1 rounded",
                                                            rule.enabled ? "text-green-300 bg-green-500/20" : "text-slate-400"
                                                        )}>
                                                            Priority {rule.priority}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                                                </div>
                                                <p className="text-xs text-slate-400 mb-3">{rule.description}</p>
                                                
                                                <div className="grid grid-cols-2 gap-4 text-xs">
                                                    <div>
                                                        <span className="text-slate-400">Trust Score:</span>
                                                        <span className="text-white ml-2">
                                                            {rule.conditions.trustScoreMin}% - {rule.conditions.trustScoreMax}%
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Types:</span>
                                                        <span className="text-white ml-2">
                                                            {rule.conditions.incidentTypes.length || 'All'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Severities:</span>
                                                        <span className="text-white ml-2">
                                                            {rule.conditions.severityLevels.length || 'All'}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400">Action:</span>
                                                        <span className={cn(
                                                            "ml-2 font-bold",
                                                            rule.actions.autoApprove ? "text-green-300" : "text-yellow-300"
                                                        )}>
                                                            {rule.actions.autoApprove ? 'Auto-Approve' : 'Review'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex space-x-2 ml-4">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => setEditingRule(rule)}
                                                    className="text-blue-400 hover:bg-blue-500/10"
                                                >
                                                    <i className="fas fa-edit" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm"
                                                    onClick={() => handleDeleteRule(rule.id)}
                                                    className="text-red-400 hover:bg-red-500/10"
                                                >
                                                    <i className="fas fa-trash" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Thresholds Tab */}
                {activeTab === 'thresholds' && (
                    <div className="space-y-6">
                        <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Global Thresholds</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-sm font-bold text-white">Enable Auto-Approval</span>
                                            <button
                                                onClick={() => setGlobalSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                                                className={cn(
                                                    "w-12 h-6 rounded-full border-2 transition-all relative",
                                                    globalSettings.enabled 
                                                        ? "bg-green-500 border-green-500" 
                                                        : "bg-slate-600 border-slate-500"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all",
                                                    globalSettings.enabled ? "right-0.5" : "left-0.5"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">
                                                Default Trust Threshold ({globalSettings.defaultTrustThreshold}%)
                                            </label>
                                            <input
                                                type="range"
                                                min="0"
                                                max="100"
                                                value={globalSettings.defaultTrustThreshold}
                                                onChange={(e) => setGlobalSettings(prev => ({ 
                                                    ...prev, 
                                                    defaultTrustThreshold: parseInt(e.target.value) 
                                                }))}
                                                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Low Trust (0)</span>
                                                <span>High Trust (100)</span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Max Bulk Approval Size</label>
                                            <input
                                                type="number"
                                                min="1"
                                                max="200"
                                                value={globalSettings.maxBulkSize}
                                                onChange={(e) => setGlobalSettings(prev => ({ 
                                                    ...prev, 
                                                    maxBulkSize: parseInt(e.target.value) || 1
                                                }))}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-sm font-bold text-white">Audit All Approvals</span>
                                            <button
                                                onClick={() => setGlobalSettings(prev => ({ ...prev, auditAllApprovals: !prev.auditAllApprovals }))}
                                                className={cn(
                                                    "w-12 h-6 rounded-full border-2 transition-all relative",
                                                    globalSettings.auditAllApprovals 
                                                        ? "bg-blue-500 border-blue-500" 
                                                        : "bg-slate-600 border-slate-500"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all",
                                                    globalSettings.auditAllApprovals ? "right-0.5" : "left-0.5"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5">
                                            <span className="text-sm font-bold text-white">Allow Manager Overrides</span>
                                            <button
                                                onClick={() => setGlobalSettings(prev => ({ ...prev, allowOverrides: !prev.allowOverrides }))}
                                                className={cn(
                                                    "w-12 h-6 rounded-full border-2 transition-all relative",
                                                    globalSettings.allowOverrides 
                                                        ? "bg-purple-500 border-purple-500" 
                                                        : "bg-slate-600 border-slate-500"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all",
                                                    globalSettings.allowOverrides ? "right-0.5" : "left-0.5"
                                                )} />
                                            </button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-bold text-white">Auto-Approval Timeout (minutes)</label>
                                            <input
                                                type="number"
                                                min="5"
                                                max="1440"
                                                value={globalSettings.timeoutMinutes}
                                                onChange={(e) => setGlobalSettings(prev => ({ 
                                                    ...prev, 
                                                    timeoutMinutes: parseInt(e.target.value) || 60
                                                }))}
                                                className="w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-white text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Testing Tab */}
                {activeTab === 'testing' && (
                    <div className="space-y-6">
                        <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                            <CardHeader>
                                <CardTitle className="text-white">Rule Testing</CardTitle>
                                <p className="text-sm text-slate-400">
                                    Test how rules would apply to your current agent population
                                </p>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {rules.filter(r => r.enabled).map(rule => {
                                        const testResult = testRule(rule);
                                        return (
                                            <div key={rule.id} className="p-4 bg-white/5 rounded-lg border border-white/5">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h4 className="text-sm font-bold text-white">{rule.name}</h4>
                                                    <span className={cn(
                                                        "px-2 py-1 text-xs font-bold rounded",
                                                        testResult.coverage >= 50 ? "text-green-300 bg-green-500/20" :
                                                        testResult.coverage >= 20 ? "text-yellow-300 bg-yellow-500/20" :
                                                        "text-red-300 bg-red-500/20"
                                                    )}>
                                                        {testResult.coverage}% Coverage
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div>
                                                        <div className="text-lg font-bold text-white">{testResult.applicableAgents}</div>
                                                        <div className="text-xs text-slate-400">Applicable Agents</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-lg font-bold text-white">{testResult.totalAgents}</div>
                                                        <div className="text-xs text-slate-400">Total Agents</div>
                                                    </div>
                                                    <div>
                                                        <div className={cn(
                                                            "text-lg font-bold",
                                                            rule.actions.autoApprove ? "text-green-400" : "text-yellow-400"
                                                        )}>
                                                            {rule.actions.autoApprove ? 'Auto' : 'Review'}
                                                        </div>
                                                        <div className="text-xs text-slate-400">Action</div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {rules.filter(r => r.enabled).length === 0 && (
                                        <div className="text-center py-8 text-slate-400">
                                            <i className="fas fa-flask text-4xl mb-4" />
                                            <p>No active rules to test. Enable some rules to see coverage analysis.</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Advanced Tab */}
                {activeTab === 'advanced' && (
                    <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Advanced Configuration</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                                    <div className="flex items-center space-x-2">
                                        <i className="fas fa-info-circle text-yellow-400" />
                                        <p className="text-sm text-yellow-200">
                                            Advanced features like rule scheduling, conditional logic, and agent-specific overrides 
                                            will be available in a future update.
                                        </p>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                                    <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                                        <CardHeader>
                                            <CardTitle className="text-sm text-white">Rule Scheduling</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-slate-400 mb-3">
                                                Configure time-based rule activation
                                            </p>
                                            <Button variant="outline" size="sm" disabled className="w-full">
                                                <i className="fas fa-clock mr-2" />
                                                Configure Schedule
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    <Card className="glass-card border border-white/5 bg-slate-900/50 backdrop-blur-xl">
                                        <CardHeader>
                                            <CardTitle className="text-sm text-white">Conditional Logic</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-xs text-slate-400 mb-3">
                                                Create complex IF/THEN rule conditions
                                            </p>
                                            <Button variant="outline" size="sm" disabled className="w-full">
                                                <i className="fas fa-code-branch mr-2" />
                                                Rule Builder
                                            </Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </Modal>
        <ConfirmDeleteModal
            isOpen={showDeleteConfirmModal}
            onClose={() => {
                setShowDeleteConfirmModal(false);
                setRuleToDelete(null);
            }}
            onConfirm={confirmDeleteRule}
            title="Delete Auto-Approval Rule"
            message="Are you sure you want to delete this auto-approval rule? This action cannot be undone."
            itemName={ruleToDelete ? rules.find(r => r.id === ruleToDelete)?.name : undefined}
        />
    </>
    );
};

export default AutoApprovalSettingsModal;