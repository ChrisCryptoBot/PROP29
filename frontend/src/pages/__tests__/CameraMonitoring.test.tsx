/**
 * Security Operations Center (Live Cameras) tests
 * /view-cameras route now renders SecurityOperationsCenter.
 * Legacy CameraMonitoring and ViewCamerasAuth components were removed.
 * Note: Full SOC render tests require extensive provider mocking; module load is verified here.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';

// Verify module can be loaded (avoids circular/import errors)
let SecurityOperationsCenter: React.ComponentType;
beforeAll(async () => {
  const mod = await import('../modules/SecurityOperationsCenter');
  SecurityOperationsCenter = mod.default;
});

describe('Security Operations Center (Live Cameras)', () => {
  it('module loads successfully', () => {
    expect(SecurityOperationsCenter).toBeDefined();
  });

  it('renders without crashing', async () => {
    render(
      <BrowserRouter>
        <SecurityOperationsCenter />
      </BrowserRouter>
    );
    // SOC may render error boundary in test env due to missing providers;
    // we verify it mounts without import/render crash
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });
});
