/**
 * Scan Package Modal
 * Modal for scanning package barcodes/QR codes
 * Placeholder for future barcode scanning functionality
 */

import React from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';

export interface ScanPackageModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ScanPackageModal: React.FC<ScanPackageModalProps> = React.memo(({
    isOpen,
    onClose
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Scan Package"
            size="md"
        >
            <div className="space-y-4">
                {/* Scanner Preview Area */}
                <div className="relative bg-slate-900 rounded-lg overflow-hidden" style={{ height: '300px' }}>
                    {/* Scanner Grid Overlay */}
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `
                                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                            `,
                            backgroundSize: '20px 20px'
                        }} />
                    </div>

                    {/* Scanning Line Animation */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-80"
                            style={{
                                animation: 'scanLine 2s ease-in-out infinite'
                            }} />
                    </div>

                    {/* Corner Brackets */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="relative" style={{ width: '200px', height: '200px' }}>
                            {/* Top Left */}
                            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500" />
                            {/* Top Right */}
                            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500" />
                            {/* Bottom Left */}
                            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500" />
                            {/* Bottom Right */}
                            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500" />
                        </div>
                    </div>

                    {/* Center QR Code Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                            <i className="fas fa-qrcode text-white text-4xl opacity-50" />
                        </div>
                    </div>

                    {/* Status Text */}
                    <div className="absolute bottom-4 left-0 right-0 text-center">
                        <p className="text-white text-sm font-medium">Point camera at package barcode/QR code</p>
                    </div>
                </div>

                {/* Instructions */}
                <div className="rounded-lg p-4 space-y-2 bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider mb-2">How to scan:</h4>
                    <ul className="space-y-1 text-sm text-slate-300">
                        <li className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Point camera at package barcode/QR code</span>
                        </li>
                        <li className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Automatic package lookup by tracking number</span>
                        </li>
                        <li className="flex items-start">
                            <i className="fas fa-check-circle text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                            <span>Quick status updates and notifications</span>
                        </li>
                    </ul>
                </div>

                {/* Manual Entry Fallback */}
                <div className="border-t border-white/10 pt-4">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                        Or Enter Tracking Number Manually
                    </label>
                    <input
                        type="text"
                        placeholder="Enter tracking number"
                        className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 hover:bg-white/10 transition-colors"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-4 border-t border-white/10">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                        Close
                    </Button>
                    <Button
                        variant="primary" className=""
                        disabled
                    >
                        <i className="fas fa-search mr-2" />
                        Scan (Coming Soon)
                    </Button>
                </div>
            </div>

            {/* CSS Animation Styles */}
            <style>{`
                @keyframes scanLine {
                    0% {
                        transform: translateY(-100%);
                        opacity: 0;
                    }
                    50% {
                        opacity: 1;
                    }
                    100% {
                        transform: translateY(100%);
                        opacity: 0;
                    }
                }
            `}</style>
        </Modal>
    );
});

ScanPackageModal.displayName = 'ScanPackageModal';



