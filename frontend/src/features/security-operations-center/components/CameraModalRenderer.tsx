/**
 * Camera Modal Renderer
 * Renders all open camera modals.
 * Resolves camera from context when available so status (e.g. "Online" after heartbeat) stays in sync.
 */

import React from 'react';
import { useCameraModalManager } from '../context/CameraModalManagerContext';
import { useSecurityOperationsContext } from '../context/SecurityOperationsContext';
import { CameraLiveModal } from './modals/CameraLiveModal';

export const CameraModalRenderer: React.FC = () => {
  const { openModals } = useCameraModalManager();
  const { cameras } = useSecurityOperationsContext();

  return (
    <>
      {openModals.map((modal) => {
        const camera = cameras.find((c) => c.id === modal.cameraId) ?? modal.camera;
        return (
          <CameraLiveModal
            key={modal.id}
            modalId={modal.id}
            camera={camera}
          />
        );
      })}
    </>
  );
};
