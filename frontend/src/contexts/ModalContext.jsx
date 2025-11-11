import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { modalConfig } from '../config/modalConfig';

const ModalContext = createContext();

const modalReducer = (state, action) => {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        [action.modalId]: {
          isOpen: true,
          modalType: action.modalType,
          data: action.data,
          config: action.config
        }
      };
    
    case 'CLOSE_MODAL':
      return {
        ...state,
        [action.modalId]: {
          ...state[action.modalId],
          isOpen: false
        }
      };
    
    case 'UPDATE_MODAL_DATA':
      return {
        ...state,
        [action.modalId]: {
          ...state[action.modalId],
          data: { ...state[action.modalId]?.data, ...action.data }
        }
      };
    
    case 'CLOSE_ALL_MODALS':
      return Object.keys(state).reduce((acc, modalId) => {
        acc[modalId] = { ...state[modalId], isOpen: false };
        return acc;
      }, {});
    
    default:
      return state;
  }
};

export const ModalProvider = ({ children }) => {
  const [modalState, dispatch] = useReducer(modalReducer, {});

  const openModal = useCallback((modalType, data = {}, modalId = modalType) => {
    const config = modalConfig[modalType];
    if (!config) {
      console.error(`Modal type ${modalType} not found in configuration`);
      return;
    }
    
    dispatch({
      type: 'OPEN_MODAL',
      modalId,
      modalType,
      data,
      config
    });
  }, []);

  const closeModal = useCallback((modalId) => {
    dispatch({ type: 'CLOSE_MODAL', modalId });
  }, []);

  const updateModalData = useCallback((modalId, data) => {
    dispatch({ type: 'UPDATE_MODAL_DATA', modalId, data });
  }, []);

  const closeAllModals = useCallback(() => {
    dispatch({ type: 'CLOSE_ALL_MODALS' });
  }, []);

  return (
    <ModalContext.Provider value={{
      modalState,
      openModal,
      closeModal,
      updateModalData,
      closeAllModals
    }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
