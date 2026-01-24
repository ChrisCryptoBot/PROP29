import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { modalConfig, ModalType, ModalConfig } from '../config/modalConfig';
import { logger } from '../services/logger';

// Modal state types
export interface ModalState {
    isOpen: boolean;
    modalType: ModalType;
    data: Record<string, any>;
    config: ModalConfig;
}

export type ModalStateMap = Record<string, ModalState>;

// Action types
type ModalAction =
    | { type: 'OPEN_MODAL'; modalId: string; modalType: ModalType; data: Record<string, any>; config: ModalConfig }
    | { type: 'CLOSE_MODAL'; modalId: string }
    | { type: 'UPDATE_MODAL_DATA'; modalId: string; data: Record<string, any> }
    | { type: 'CLOSE_ALL_MODALS' };

// Context type
interface ModalContextType {
    modalState: ModalStateMap;
    openModal: (modalType: ModalType, data?: Record<string, any>, modalId?: string) => void;
    closeModal: (modalId: string) => void;
    updateModalData: (modalId: string, data: Record<string, any>) => void;
    closeAllModals: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

const modalReducer = (state: ModalStateMap, action: ModalAction): ModalStateMap => {
    switch (action.type) {
        case 'OPEN_MODAL':
            return {
                ...state,
                [action.modalId]: {
                    isOpen: true,
                    modalType: action.modalType,
                    data: action.data,
                    config: action.config,
                },
            };

        case 'CLOSE_MODAL':
            return {
                ...state,
                [action.modalId]: {
                    ...state[action.modalId],
                    isOpen: false,
                },
            };

        case 'UPDATE_MODAL_DATA':
            return {
                ...state,
                [action.modalId]: {
                    ...state[action.modalId],
                    data: { ...state[action.modalId]?.data, ...action.data },
                },
            };

        case 'CLOSE_ALL_MODALS':
            return Object.keys(state).reduce((acc, modalId) => {
                acc[modalId] = { ...state[modalId], isOpen: false };
                return acc;
            }, {} as ModalStateMap);

        default:
            return state;
    }
};

interface ModalProviderProps {
    children: ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
    const [modalState, dispatch] = useReducer(modalReducer, {});

    const openModal = useCallback((modalType: ModalType, data: Record<string, any> = {}, modalId: string = modalType) => {
        const config = modalConfig[modalType];
        if (!config) {
            logger.error(`Modal type ${modalType} not found in configuration`, undefined, { module: 'ModalContext', modalType });
            return;
        }

        dispatch({
            type: 'OPEN_MODAL',
            modalId,
            modalType,
            data,
            config,
        });
    }, []);

    const closeModal = useCallback((modalId: string) => {
        dispatch({ type: 'CLOSE_MODAL', modalId });
    }, []);

    const updateModalData = useCallback((modalId: string, data: Record<string, any>) => {
        dispatch({ type: 'UPDATE_MODAL_DATA', modalId, data });
    }, []);

    const closeAllModals = useCallback(() => {
        dispatch({ type: 'CLOSE_ALL_MODALS' });
    }, []);

    return (
        <ModalContext.Provider
            value={{
                modalState,
                openModal,
                closeModal,
                updateModalData,
                closeAllModals,
            }}
        >
            {children}
        </ModalContext.Provider>
    );
};

export const useModal = (): ModalContextType => {
    const context = useContext(ModalContext);
    if (!context) {
        throw new Error('useModal must be used within a ModalProvider');
    }
    return context;
};

