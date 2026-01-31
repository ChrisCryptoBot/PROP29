/**
 * Camera Modal Renderer
 * Renders all open camera modals
 */

import React from 'react';
import { useCameraModalManager } from '../context/CameraModalManagerContext';
import { CameraLiveModal } from './modals/CameraLiveModal';

export const CameraModalRenderer: React.FC = () => {
  const { openModals } = useCameraModalManager();

  return (
    <>
      {openModals.map((modal) => (
        <CameraLiveModal
          key={modal.id}
          modalId={modal.id}
          camera={modal.camera}
        />
      ))}
    </>
  );
};
