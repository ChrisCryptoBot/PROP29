import React from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useBannedIndividualsContext } from '../../context/BannedIndividualsContext';

export const VideoFootageModal: React.FC = () => {
    const {
        showVideoFootageModal,
        setShowVideoFootageModal,
        selectedVideoUrl
    } = useBannedIndividualsContext();

    if (!showVideoFootageModal || !selectedVideoUrl) return null;

    return (
        <Modal
            isOpen={showVideoFootageModal}
            onClose={() => setShowVideoFootageModal(false)}
            title="Video footage"
            size="lg"
            footer={<Button variant="subtle" onClick={() => setShowVideoFootageModal(false)}>Cancel</Button>}
        >
            <div className="relative bg-black rounded-md overflow-hidden border border-white/5">
                <video
                    src={selectedVideoUrl}
                    controls
                    className="w-full h-auto max-h-[60vh]"
                    autoPlay
                >
                    Your browser does not support the video tag.
                </video>
            </div>
        </Modal>
    );
};
