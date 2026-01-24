/**
 * Package Details Modal
 * Modal for viewing and editing package details
 */

import React, { useState, useEffect } from 'react';
import { Modal } from '../../../../components/UI/Modal';
import { Button } from '../../../../components/UI/Button';
import { usePackageContext } from '../../context/PackageContext';
import { PackageStatus } from '../../types/package.types';
import { cn } from '../../../../utils/cn';

export interface PackageDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const PackageDetailsModal: React.FC<PackageDetailsModalProps> = React.memo(({
    isOpen,
    onClose
}) => {
    const {
        selectedPackage,
        setSelectedPackage,
        updatePackage,
        notifyGuest,
        deliverPackage,
        pickupPackage,
        deletePackage,
        loading
    } = usePackageContext();

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleString();
        } catch {
            return dateString;
        }
    };

    const getLocationDisplay = (location?: { area?: string; floor?: string; building?: string; room?: string }) => {
        if (!location) return 'Not specified';
        const parts = [location.building, location.floor, location.area, location.room].filter(Boolean);
        return parts.length > 0 ? parts.join(' - ') : 'Not specified';
    };

    const getStatusBadgeClass = (status: PackageStatus) => {
        switch (status) {
            case PackageStatus.PENDING:
            case PackageStatus.RECEIVED:
                return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
            case PackageStatus.NOTIFIED:
                return 'text-amber-300 bg-amber-500/20 border-amber-500/30';
            case PackageStatus.DELIVERED:
                return 'text-green-300 bg-green-500/20 border-green-500/30';
            case PackageStatus.EXPIRED:
                return 'text-red-300 bg-red-500/20 border-red-500/30';
            default:
                return 'text-slate-300 bg-slate-500/20 border-slate-500/30';
        }
    };

    const handleNotify = async () => {
        if (selectedPackage) {
            const success = await notifyGuest(selectedPackage.package_id);
            if (success) {
                // Modal will remain open with updated package
            }
        }
    };

    const handleDeliver = async () => {
        if (selectedPackage) {
            const success = await deliverPackage(selectedPackage.package_id);
            if (success) {
                // Modal will remain open with updated package
            }
        }
    };

    const handlePickup = async () => {
        if (selectedPackage) {
            const success = await pickupPackage(selectedPackage.package_id);
            if (success) {
                // Modal will remain open with updated package
            }
        }
    };

    const handleDelete = async () => {
        if (selectedPackage && window.confirm('Are you sure you want to delete this package?')) {
            const success = await deletePackage(selectedPackage.package_id);
            if (success) {
                onClose();
            }
        }
    };

    if (!selectedPackage) {
        return null;
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Package Details"
            size="lg"
        >
            <div className="space-y-6">
                {/* Header with Status */}
                <div className="flex items-start justify-between pb-4 border-b border-white/10">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">
                            {selectedPackage.tracking_number || 'No Tracking Number'}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">
                            {selectedPackage.sender_name || 'Unknown Sender'}
                        </p>
                    </div>
                    <span className={cn(
                        "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border",
                        getStatusBadgeClass(selectedPackage.status)
                    )}>
                        {selectedPackage.status.toUpperCase().replace('_', ' ')}
                    </span>
                </div>

                {/* Package Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Tracking Number
                        </label>
                        <p className="text-sm font-mono text-white bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                            {selectedPackage.tracking_number || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Status
                        </label>
                        <p className="text-sm font-medium text-white px-3 py-2">
                            {selectedPackage.status.replace('_', ' ').toUpperCase()}
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Sender Name
                        </label>
                        <p className="text-sm font-medium text-white px-3 py-2">
                            {selectedPackage.sender_name || 'N/A'}
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Sender Contact
                        </label>
                        <p className="text-sm font-medium text-white px-3 py-2">
                            {selectedPackage.sender_contact || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Size
                        </label>
                        <p className="text-sm font-medium text-white px-3 py-2">
                            {selectedPackage.size || 'N/A'}
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Weight
                        </label>
                        <p className="text-sm font-medium text-white px-3 py-2">
                            {selectedPackage.weight ? `${selectedPackage.weight} lbs` : 'N/A'}
                        </p>
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Location
                        </label>
                        <p className="text-sm font-medium text-white bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                            {getLocationDisplay(selectedPackage.location)}
                        </p>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                            Received At
                        </label>
                        <p className="text-sm font-medium text-white px-3 py-2">
                            {formatDate(selectedPackage.received_at)}
                        </p>
                    </div>
                    {selectedPackage.notified_at && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Notified At
                            </label>
                            <p className="text-sm font-medium text-white px-3 py-2">
                                {formatDate(selectedPackage.notified_at)}
                            </p>
                        </div>
                    )}
                    {selectedPackage.delivered_at && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Delivered At
                            </label>
                            <p className="text-sm font-medium text-white px-3 py-2">
                                {formatDate(selectedPackage.delivered_at)}
                            </p>
                        </div>
                    )}
                    {selectedPackage.delivered_to && (
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Delivered To
                            </label>
                            <p className="text-sm font-medium text-white px-3 py-2">
                                {selectedPackage.delivered_to}
                            </p>
                        </div>
                    )}
                    {selectedPackage.description && (
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Description
                            </label>
                            <p className="text-sm text-slate-200 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                                {selectedPackage.description}
                            </p>
                        </div>
                    )}
                    {selectedPackage.notes && (
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                                Notes
                            </label>
                            <p className="text-sm text-slate-200 bg-white/5 px-3 py-2 rounded-lg border border-white/10">
                                {selectedPackage.notes}
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
                    {selectedPackage.status === PackageStatus.RECEIVED && (
                        <Button
                            onClick={handleNotify}
                            disabled={loading.packages}
                            variant="primary" className=""
                        >
                            <i className="fas fa-bell mr-2" />
                            Notify Guest
                        </Button>
                    )}
                    {selectedPackage.status === PackageStatus.NOTIFIED && (
                        <Button
                            onClick={handleDeliver}
                            disabled={loading.packages}
                            variant="primary" className=""
                        >
                            <i className="fas fa-check mr-2" />
                            Mark Delivered
                        </Button>
                    )}
                    {selectedPackage.status === PackageStatus.DELIVERED && (
                        <Button
                            onClick={handlePickup}
                            disabled={loading.packages}
                            variant="primary" className=""
                        >
                            <i className="fas fa-check-circle mr-2" />
                            Mark Picked Up
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        disabled={loading.packages}
                        className=""
                    >
                        <i className="fas fa-trash mr-2" />
                        Delete
                    </Button>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="ml-auto border-white/10 text-slate-300 hover:bg-white/10 hover:text-white"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </Modal >
    );
});

PackageDetailsModal.displayName = 'PackageDetailsModal';




