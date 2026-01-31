/**
 * Camera Modal Manager Context
 * Manages multiple simultaneous camera modals with position/size persistence
 */

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { CameraEntry } from '../types/security-operations.types';

export interface ModalState {
  id: string;
  cameraId: string;
  camera: CameraEntry;
  position: { x: number; y: number } | null;
  size: { width: number; height: number };
  displayId?: string;
  zIndex: number;
}

interface CameraModalManagerContextValue {
  openModals: ModalState[];
  openModal: (camera: CameraEntry) => string;
  closeModal: (modalId: string) => void;
  closeAllModals: () => void;
  updateModalPosition: (modalId: string, position: { x: number; y: number }) => void;
  updateModalSize: (modalId: string, size: { width: number; height: number }) => void;
  updateModalDisplay: (modalId: string, displayId: string) => void;
  bringToFront: (modalId: string) => void;
  getModal: (modalId: string) => ModalState | undefined;
  isModalOpen: (cameraId: string) => boolean;
}

const CameraModalManagerContext = createContext<CameraModalManagerContextValue | undefined>(undefined);

const DEFAULT_SIZE = { width: 900, height: 560 };
let nextZIndex = 1000;

export const CameraModalManagerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [openModals, setOpenModals] = useState<ModalState[]>([]);

  const openModal = useCallback((camera: CameraEntry): string => {
    // Check if modal already open for this camera
    const existing = openModals.find(m => m.cameraId === camera.id);
    if (existing) {
      bringToFront(existing.id);
      return existing.id;
    }

    const modalId = `camera-modal-${camera.id}-${Date.now()}`;
    const newModal: ModalState = {
      id: modalId,
      cameraId: camera.id,
      camera,
      position: null, // Will be centered initially
      size: DEFAULT_SIZE,
      zIndex: nextZIndex++
    };

    setOpenModals(prev => [...prev, newModal]);
    return modalId;
  }, [openModals]);

  const closeModal = useCallback((modalId: string) => {
    setOpenModals(prev => prev.filter(m => m.id !== modalId));
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModals([]);
  }, []);

  const updateModalPosition = useCallback((modalId: string, position: { x: number; y: number }) => {
    setOpenModals(prev => prev.map(m => 
      m.id === modalId ? { ...m, position } : m
    ));
  }, []);

  const updateModalSize = useCallback((modalId: string, size: { width: number; height: number }) => {
    setOpenModals(prev => prev.map(m => 
      m.id === modalId ? { ...m, size } : m
    ));
  }, []);

  const updateModalDisplay = useCallback((modalId: string, displayId: string) => {
    setOpenModals(prev => prev.map(m => 
      m.id === modalId ? { ...m, displayId } : m
    ));
  }, []);

  const bringToFront = useCallback((modalId: string) => {
    setOpenModals(prev => prev.map(m => 
      m.id === modalId ? { ...m, zIndex: nextZIndex++ } : m
    ));
  }, []);

  const getModal = useCallback((modalId: string): ModalState | undefined => {
    return openModals.find(m => m.id === modalId);
  }, [openModals]);

  const isModalOpen = useCallback((cameraId: string): boolean => {
    return openModals.some(m => m.cameraId === cameraId);
  }, [openModals]);

  return (
    <CameraModalManagerContext.Provider
      value={{
        openModals,
        openModal,
        closeModal,
        closeAllModals,
        updateModalPosition,
        updateModalSize,
        updateModalDisplay,
        bringToFront,
        getModal,
        isModalOpen,
      }}
    >
      {children}
    </CameraModalManagerContext.Provider>
  );
};

export const useCameraModalManager = (): CameraModalManagerContextValue => {
  const context = useContext(CameraModalManagerContext);
  if (!context) {
    throw new Error('useCameraModalManager must be used within CameraModalManagerProvider');
  }
  return context;
};
