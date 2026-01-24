import React from 'react';
import { useModal } from '../../contexts/ModalContext';
import { modalConfig, MODAL_TYPES, ModalType, ModalConfig } from '../../config/modalConfig';

// Import only existing modal components
// import SecurityAlertsModal from './SecurityAlertsModal';
// import PatrolCommandCenterModal from './PatrolCommandCenterModal'; // DELETED
// import PredictiveIntelConfigModal from './PredictiveIntelConfigModal';

interface PlaceholderModalProps {
    title: string;
    isOpen: boolean;
    onClose: () => void;
}

// Simple placeholder modal for unimplemented modals
const PlaceholderModal: React.FC<PlaceholderModalProps> = ({ title, isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{title}</h2>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="modal-content">
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                        <i className="fas fa-cog fa-spin" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                        <h3>Coming Soon</h3>
                        <p>This modal is currently under development.</p>
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ModalManager: React.FC = () => {
    const { modalState, closeModal } = useModal();

    const renderModal = (modalId: string, modal: { modalType: ModalType; data: Record<string, any>; config: ModalConfig; isOpen: boolean }) => {
        const { modalType, config } = modal;

        switch (modalType) {
            case MODAL_TYPES.PATROL_COMMAND_CENTER:
                return (
                    <PlaceholderModal
                        key={modalId}
                        title="Patrol Command Center"
                        isOpen={true}
                        onClose={() => closeModal(modalId)}
                    />
                );
            default:
                return (
                    <PlaceholderModal
                        key={modalId}
                        title={config?.title || 'Unknown Modal'}
                        isOpen={true}
                        onClose={() => closeModal(modalId)}
                    />
                );
        }
    };

    return (
        <>
            {Object.entries(modalState).map(([modalId, modal]) => renderModal(modalId, modal))}
        </>
    );
};

