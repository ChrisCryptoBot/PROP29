/**
 * Keyboard Navigation Hook
 * Provides comprehensive keyboard shortcuts for desktop MSO application
 * Essential for power users and accessibility compliance
 * 
 * Features:
 * - Global keyboard shortcuts
 * - Context-aware navigation
 * - Modal management via keyboard
 * - Bulk operations shortcuts
 * - Accessibility enhancements
 * - Focus management
 */

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    preventDefault?: boolean;
    description: string;
    handler: (event: KeyboardEvent) => void;
    disabled?: boolean;
    context?: string; // Optional context filter
}

interface UseKeyboardNavigationOptions {
    disabled?: boolean;
    context?: string;
    captureGlobal?: boolean;
    enableDebugMode?: boolean;
}

export const useKeyboardNavigation = (
    shortcuts: KeyboardShortcut[],
    options: UseKeyboardNavigationOptions = {}
) => {
    const {
        disabled = false,
        context,
        captureGlobal = false,
        enableDebugMode = false
    } = options;

    const shortcutsRef = useRef(shortcuts);
    const debugModeRef = useRef(enableDebugMode);

    // Update refs when shortcuts or debug mode changes
    useEffect(() => {
        shortcutsRef.current = shortcuts;
    }, [shortcuts]);

    useEffect(() => {
        debugModeRef.current = enableDebugMode;
    }, [enableDebugMode]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (disabled) return;

        const { key, ctrlKey, shiftKey, altKey, metaKey } = event;

        // Skip if typing in input fields (unless specifically captured)
        const target = event.target as HTMLElement;
        const isInputField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true';
        
        if (isInputField && !captureGlobal) return;

        // Debug mode logging
        if (debugModeRef.current) {
            console.log('KeyboardNavigation:', {
                key,
                ctrlKey,
                shiftKey,
                altKey,
                metaKey,
                context,
                target: target.tagName
            });
        }

        // Find matching shortcuts
        const matchingShortcuts = shortcutsRef.current.filter(shortcut => {
            // Check if shortcut is disabled
            if (shortcut.disabled) return false;

            // Check context match
            if (shortcut.context && shortcut.context !== context) return false;

            // Check key match (case insensitive)
            if (shortcut.key.toLowerCase() !== key.toLowerCase()) return false;

            // Check modifier keys
            if (Boolean(shortcut.ctrlKey) !== ctrlKey) return false;
            if (Boolean(shortcut.shiftKey) !== shiftKey) return false;
            if (Boolean(shortcut.altKey) !== altKey) return false;
            if (Boolean(shortcut.metaKey) !== metaKey) return false;

            return true;
        });

        // Execute matching shortcuts
        matchingShortcuts.forEach(shortcut => {
            if (shortcut.preventDefault !== false) {
                event.preventDefault();
                event.stopPropagation();
            }

            try {
                shortcut.handler(event);
                
                if (debugModeRef.current) {
                    console.log('Executed shortcut:', shortcut.description);
                }
            } catch (error) {
                console.error('Keyboard shortcut execution failed:', error, shortcut);
            }
        });

    }, [disabled, context, captureGlobal]);

    useEffect(() => {
        if (disabled) return;

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown, disabled]);

    return {
        shortcuts: shortcutsRef.current,
        isEnabled: !disabled,
        context
    };
};

/**
 * Pre-built keyboard shortcuts for incident log module
 */
export const useIncidentLogKeyboardShortcuts = (actions: {
    refreshIncidents?: () => void;
    createIncident?: () => void;
    showFilters?: () => void;
    showSettings?: () => void;
    showReports?: () => void;
    showEmergencyAlert?: () => void;
    // Bulk operations
    selectAll?: () => void;
    bulkApprove?: () => void;
    bulkReject?: () => void;
    bulkDelete?: () => void;
    // Navigation
    nextTab?: () => void;
    prevTab?: () => void;
    closeModal?: () => void;
    // Agent performance
    showAgentPerformance?: () => void;
    showAutoApprovalSettings?: () => void;
}) => {
    const shortcuts: KeyboardShortcut[] = [
        // Global Actions
        {
            key: 'F5',
            description: 'Refresh incidents',
            handler: () => actions.refreshIncidents?.(),
            disabled: !actions.refreshIncidents
        },
        {
            key: 'n',
            ctrlKey: true,
            description: 'Create new incident',
            handler: () => actions.createIncident?.(),
            disabled: !actions.createIncident
        },
        {
            key: 'f',
            ctrlKey: true,
            description: 'Show advanced filters',
            handler: () => actions.showFilters?.(),
            disabled: !actions.showFilters
        },
        {
            key: ',',
            ctrlKey: true,
            description: 'Open settings',
            handler: () => actions.showSettings?.(),
            disabled: !actions.showSettings
        },
        {
            key: 'r',
            ctrlKey: true,
            description: 'Generate report',
            handler: () => actions.showReports?.(),
            disabled: !actions.showReports
        },
        {
            key: 'e',
            ctrlKey: true,
            shiftKey: true,
            description: 'Emergency alert',
            handler: () => actions.showEmergencyAlert?.(),
            disabled: !actions.showEmergencyAlert
        },

        // Selection and Bulk Operations
        {
            key: 'a',
            ctrlKey: true,
            description: 'Select all incidents',
            handler: (event) => {
                event.preventDefault();
                actions.selectAll?.();
            },
            disabled: !actions.selectAll,
            context: 'review-queue'
        },
        {
            key: 'Enter',
            ctrlKey: true,
            description: 'Bulk approve selected',
            handler: () => actions.bulkApprove?.(),
            disabled: !actions.bulkApprove,
            context: 'review-queue'
        },
        {
            key: 'Delete',
            ctrlKey: true,
            description: 'Bulk reject selected',
            handler: () => actions.bulkReject?.(),
            disabled: !actions.bulkReject,
            context: 'review-queue'
        },
        {
            key: 'Delete',
            ctrlKey: true,
            shiftKey: true,
            description: 'Bulk delete selected',
            handler: () => actions.bulkDelete?.(),
            disabled: !actions.bulkDelete,
            context: 'incidents'
        },

        // Navigation
        {
            key: 'Tab',
            ctrlKey: true,
            description: 'Next tab',
            handler: () => actions.nextTab?.(),
            disabled: !actions.nextTab
        },
        {
            key: 'Tab',
            ctrlKey: true,
            shiftKey: true,
            description: 'Previous tab',
            handler: () => actions.prevTab?.(),
            disabled: !actions.prevTab
        },
        {
            key: 'Escape',
            description: 'Close modal or cancel action',
            handler: () => actions.closeModal?.(),
            disabled: !actions.closeModal,
            preventDefault: false // Allow default escape behavior
        },

        // Agent Performance & Advanced Features
        {
            key: 'p',
            ctrlKey: true,
            shiftKey: true,
            description: 'Agent performance analytics',
            handler: () => actions.showAgentPerformance?.(),
            disabled: !actions.showAgentPerformance
        },
        {
            key: 'a',
            ctrlKey: true,
            shiftKey: true,
            description: 'Auto-approval settings',
            handler: () => actions.showAutoApprovalSettings?.(),
            disabled: !actions.showAutoApprovalSettings
        },

        // Quick Actions (F-keys for power users)
        {
            key: 'F1',
            description: 'Show keyboard shortcuts help',
            handler: () => {
                // TODO: Implement help modal
                console.info('Keyboard shortcuts help would be shown here');
            }
        },
        {
            key: 'F6',
            description: 'Switch to dashboard',
            handler: () => {
                window.location.hash = '#/dashboard';
            }
        },
        {
            key: 'F7',
            description: 'Switch to review queue',
            handler: () => {
                window.location.hash = '#/review-queue';
            }
        },
        {
            key: 'F8',
            description: 'Switch to incidents list',
            handler: () => {
                window.location.hash = '#/incidents';
            }
        },
        {
            key: 'F9',
            description: 'Switch to trends analysis',
            handler: () => {
                window.location.hash = '#/trends';
            }
        },
        {
            key: 'F10',
            description: 'Switch to AI predictions',
            handler: () => {
                window.location.hash = '#/predictions';
            }
        },
        {
            key: 'F11',
            description: 'Switch to settings',
            handler: () => {
                window.location.hash = '#/settings';
            }
        }
    ];

    return useKeyboardNavigation(shortcuts, {
        enableDebugMode: process.env.NODE_ENV === 'development',
        captureGlobal: true
    });
};

/**
 * Focus management utilities for keyboard navigation
 */
export const useFocusManagement = () => {
    const focusableElementsSelector = [
        'button:not([disabled])',
        'input:not([disabled])',
        'textarea:not([disabled])',
        'select:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])'
    ].join(', ');

    const getFocusableElements = useCallback((container?: HTMLElement): HTMLElement[] => {
        const root = container || document;
        return Array.from(root.querySelectorAll(focusableElementsSelector)) as HTMLElement[];
    }, []);

    const trapFocus = useCallback((containerElement: HTMLElement) => {
        const focusableElements = getFocusableElements(containerElement);
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return;

            if (event.shiftKey) {
                // Shift + Tab
                if (document.activeElement === firstElement) {
                    event.preventDefault();
                    lastElement?.focus();
                }
            } else {
                // Tab
                if (document.activeElement === lastElement) {
                    event.preventDefault();
                    firstElement?.focus();
                }
            }
        };

        containerElement.addEventListener('keydown', handleKeyDown);
        
        // Focus first element
        firstElement?.focus();

        return () => {
            containerElement.removeEventListener('keydown', handleKeyDown);
        };
    }, [getFocusableElements]);

    const restoreFocus = useCallback((previousElement?: HTMLElement) => {
        if (previousElement && previousElement.focus) {
            previousElement.focus();
        }
    }, []);

    const focusFirstElement = useCallback((container?: HTMLElement) => {
        const focusableElements = getFocusableElements(container);
        focusableElements[0]?.focus();
    }, [getFocusableElements]);

    return {
        getFocusableElements,
        trapFocus,
        restoreFocus,
        focusFirstElement
    };
};

/**
 * Accessibility announcements for screen readers
 */
export const useAccessibilityAnnouncements = () => {
    const announceToScreenReader = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', priority);
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;

        document.body.appendChild(announcement);

        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }, []);

    const announceIncidentCreated = useCallback((incidentTitle: string) => {
        announceToScreenReader(`New incident created: ${incidentTitle}`, 'assertive');
    }, [announceToScreenReader]);

    const announceBulkOperationComplete = useCallback((operation: string, count: number) => {
        announceToScreenReader(`Bulk ${operation} operation completed for ${count} incidents`, 'assertive');
    }, [announceToScreenReader]);

    const announceNavigationChange = useCallback((newLocation: string) => {
        announceToScreenReader(`Navigated to ${newLocation}`, 'polite');
    }, [announceToScreenReader]);

    return {
        announceToScreenReader,
        announceIncidentCreated,
        announceBulkOperationComplete,
        announceNavigationChange
    };
};

export default useKeyboardNavigation;