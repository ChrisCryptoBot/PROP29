/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SecurityOperationsProvider, useSecurityOperationsContext } from '../context/SecurityOperationsContext';

jest.mock('../hooks/useSecurityOperationsState', () => ({
  useSecurityOperationsState: jest.fn(),
}));

const mockUseSecurityOperationsState = require('../hooks/useSecurityOperationsState').useSecurityOperationsState;

describe('SecurityOperationsContext', () => {
  const mockContextValue = {
    cameras: [],
    recordings: [],
    evidence: [],
    metrics: { total: 0, online: 0, offline: 0, maintenance: 0, recording: 0, avgUptime: '0%' },
    analytics: { motionEvents: 0, alertsTriggered: 0, averageResponseTime: 'N/A', peakActivity: 'N/A' },
    settings: {
      recordingQuality: '4K',
      recordingDuration: '30 days',
      motionSensitivity: 'Medium',
      storageRetention: '90 days',
      autoDelete: true,
      notifyOnMotion: true,
      notifyOnOffline: true,
      nightVisionAuto: true,
    },
    loading: {
      cameras: false,
      recordings: false,
      evidence: false,
      metrics: false,
      analytics: false,
      settings: false,
      actions: false,
    },
    canManageCameras: true,
    canManageEvidence: true,
    canUpdateSettings: true,
    selectedCamera: null,
    setSelectedCamera: jest.fn(),
    selectedRecording: null,
    setSelectedRecording: jest.fn(),
    selectedEvidence: null,
    setSelectedEvidence: jest.fn(),
    showEvidenceModal: false,
    setShowEvidenceModal: jest.fn(),
    refreshCameras: jest.fn(),
    refreshRecordings: jest.fn(),
    refreshEvidence: jest.fn(),
    refreshMetrics: jest.fn(),
    refreshAnalytics: jest.fn(),
    refreshSettings: jest.fn(),
    markEvidenceReviewed: jest.fn(),
    archiveEvidence: jest.fn(),
    updateSettings: jest.fn(),
    toggleRecording: jest.fn(),
    toggleMotionDetection: jest.fn(),
    reportCameraIssue: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSecurityOperationsState.mockReturnValue(mockContextValue);
  });

  const TestComponent: React.FC = () => {
    const context = useSecurityOperationsContext();
    return (
      <div>
        <div data-testid="camera-count">{context.cameras.length}</div>
        <div data-testid="metrics-total">{context.metrics.total}</div>
        <button data-testid="refresh" onClick={context.refreshCameras}>Refresh</button>
      </div>
    );
  };

  it('provides context values to children', () => {
    render(
      <SecurityOperationsProvider>
        <TestComponent />
      </SecurityOperationsProvider>
    );

    expect(screen.getByTestId('camera-count')).toHaveTextContent('0');
    expect(screen.getByTestId('metrics-total')).toHaveTextContent('0');
  });

  it('throws error when used outside provider', () => {
    const originalError = console.error;
    console.error = jest.fn();

    const BadComponent: React.FC = () => {
      useSecurityOperationsContext();
      return <div>Bad</div>;
    };

    expect(() => render(<BadComponent />)).toThrow('useSecurityOperationsContext must be used within a SecurityOperationsProvider');

    console.error = originalError;
  });

  it('invokes context actions', () => {
    render(
      <SecurityOperationsProvider>
        <TestComponent />
      </SecurityOperationsProvider>
    );

    const refreshButton = screen.getByTestId('refresh');
    act(() => {
      refreshButton.click();
    });

    expect(mockContextValue.refreshCameras).toHaveBeenCalled();
  });
});

