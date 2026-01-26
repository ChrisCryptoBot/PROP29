/**
 * Item Details Modal
 * Displays comprehensive information about a lost & found item
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Avatar } from '../../../../components/UI/Avatar';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { cn } from '../../../../utils/cn';
import { LostFoundStatus } from '../../types/lost-and-found.types';

interface ItemDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ItemDetailsModal: React.FC<ItemDetailsModalProps> = ({ isOpen, onClose }) => {
    const {
        selectedItem,
        loading,
        notifyGuest,
        claimItem,
        archiveItem
    } = useLostFoundContext();

    if (!isOpen || !selectedItem) return null;

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'found': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            case 'claimed': return 'text-green-300 bg-green-500/20 border border-green-500/30';
            case 'expired': return 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
            case 'donated': return 'text-indigo-300 bg-indigo-500/20 border border-indigo-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
        }
    };

    const getCategoryIcon = (category: string) => {
        switch (category.toLowerCase()) {
            case 'electronics': return 'fas fa-mobile-alt text-blue-400';
            case 'jewelry': return 'fas fa-gem text-purple-400';
            case 'personal items': return 'fas fa-wallet text-amber-400';
            case 'accessories': return 'fas fa-sunglasses text-pink-400';
            case 'clothing': return 'fas fa-tshirt text-indigo-400';
            case 'documents': return 'fas fa-file-alt text-slate-400';
            case 'keys': return 'fas fa-key text-yellow-400';
            case 'sports equipment': return 'fas fa-basketball-ball text-orange-400';
            case 'weapons': return 'fas fa-exclamation-triangle text-red-500';
            default: return 'fas fa-box text-slate-400';
        }
    };

    const itemName = selectedItem.name || selectedItem.item_type || 'Unnamed Item';
    const category = selectedItem.category || selectedItem.item_type || 'Other';
    const location = typeof selectedItem.location_found === 'string'
        ? selectedItem.location_found
        : (selectedItem.location_found as any)?.area || 'Unknown';
    const value = selectedItem.value_estimate || 0;
    const storageLocation = selectedItem.storageLocation || 'Storage Room A';
    const dateFound = selectedItem.found_date || new Date().toISOString();
    const expirationDate = selectedItem.expirationDate || (selectedItem.legalCompliance?.retentionPeriod
        ? new Date(new Date(dateFound).getTime() + (selectedItem.legalCompliance.retentionPeriod * 24 * 60 * 60 * 1000)).toISOString()
        : new Date().toISOString());

    const handleNotifyGuest = async () => {
        await notifyGuest(selectedItem.item_id);
        onClose();
    };

    const handleClaimItem = async () => {
        await claimItem(selectedItem.item_id, {
            item_id: selectedItem.item_id,
            claimer_name: 'Guest',
            claimer_contact: '',
            description: 'Item claimed'
        });
        onClose();
    };

    const handleArchiveItem = async () => {
        await archiveItem(selectedItem.item_id);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="glass-card border-white/5 shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
                    <CardTitle className="flex items-center text-xl text-white">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3 shadow-lg ring-1 ring-white/10">
                            <i className={cn("text-lg", getCategoryIcon(category))} />
                        </div>
                        {itemName}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full w-8 h-8 p-0 flex items-center justify-center transition-colors"
                    >
                        <i className="fas fa-times" />
                    </Button>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column - Item Details */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Item Information</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-400">Category</span>
                                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded text-slate-300 bg-white/5 border border-white/5">{category}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-400">Status</span>
                                        <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded border ${getStatusBadgeClass(selectedItem.status)}`}>
                                            {selectedItem.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-400">Estimated Value</span>
                                        <span className="font-semibold text-white">{value ? `$${value}` : 'Unknown'}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-400">Date Found</span>
                                        <span className="font-semibold text-white">{new Date(dateFound).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-400">Location Found</span>
                                        <span className="font-semibold text-white">{location}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-400">Storage Location</span>
                                        <span className="font-semibold text-white">{storageLocation}</span>
                                    </div>
                                    <div className="flex items-center justify-between py-2 border-b border-white/5">
                                        <span className="text-sm text-slate-400">Expiration Date</span>
                                        <span className="font-semibold text-white">{new Date(expirationDate).toLocaleDateString()}</span>
                                    </div>
                                    {selectedItem.aiMatchConfidence && (
                                        <div className="flex items-center justify-between py-2 border-b border-white/5">
                                            <span className="text-sm text-slate-400">AI Match Confidence</span>
                                            <div className="flex items-center space-x-2">
                                                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-300 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                        style={{ width: `${selectedItem.aiMatchConfidence}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-bold text-blue-400">{selectedItem.aiMatchConfidence}%</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-white/5 pb-2">Description</h3>
                                <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                    <p className="text-sm text-slate-300 leading-relaxed italic">"{selectedItem.description}"</p>
                                </div>
                            </div>

                            {selectedItem.qrCode && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-white/5 pb-2">QR Code</h3>
                                    <div className="p-6 bg-white/5 border border-white/5 rounded-lg text-center">
                                        <div className="w-32 h-32 bg-white p-2 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-lg">
                                            <i className="fas fa-qrcode text-6xl text-slate-900" />
                                        </div>
                                        <p className="text-xs text-slate-500 font-mono bg-slate-900/50 py-1 px-3 rounded-full inline-block border border-white/5">
                                            {selectedItem.qrCode}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Guest Info & Actions */}
                        <div className="space-y-6">
                            {selectedItem.guestInfo && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Guest Information</h3>
                                    <Card className="glass-card border-white/5 bg-white/5">
                                        <CardContent className="p-4 space-y-3">
                                            <div className="flex items-center space-x-3">
                                                <Avatar className="w-12 h-12 ring-2 ring-white/10">
                                                    <div className="w-full h-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-inner">
                                                        {selectedItem.guestInfo.name.charAt(0)}
                                                    </div>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-white">{selectedItem.guestInfo.name}</p>
                                                    <p className="text-sm text-slate-400">Room {selectedItem.guestInfo.room}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-2 pt-3 border-t border-white/5">
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <i className="fas fa-phone text-slate-500 w-4" />
                                                    <span className="text-slate-300">{selectedItem.guestInfo.phone}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <i className="fas fa-envelope text-slate-500 w-4" />
                                                    <span className="text-slate-300">{selectedItem.guestInfo.email}</span>
                                                </div>
                                                <div className="flex items-center space-x-2 text-sm">
                                                    <i className="fas fa-calendar text-slate-500 w-4" />
                                                    <span className="text-slate-300">
                                                        {new Date(selectedItem.guestInfo.checkInDate).toLocaleDateString()} - {new Date(selectedItem.guestInfo.checkOutDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            <div>
                                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Notifications</h3>
                                <Card className="glass-card border-white/5 bg-white/5">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm text-slate-400">Notifications Sent</span>
                                            <span className="px-2.5 py-1 text-[10px] font-bold rounded text-blue-300 bg-blue-500/20 border border-blue-500/30">
                                                {selectedItem.notificationsSent || 0}
                                            </span>
                                        </div>
                                        {selectedItem.lastNotificationDate && (
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm text-slate-400">Last Notification</span>
                                                <span className="text-sm text-white">{new Date(selectedItem.lastNotificationDate).toLocaleString()}</span>
                                            </div>
                                        )}
                                        {selectedItem.status === LostFoundStatus.FOUND && selectedItem.guestInfo && (
                                            <Button
                                                variant="primary"
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold"
                                                onClick={handleNotifyGuest}
                                                disabled={loading.items}
                                            >
                                                <i className="fas fa-bell mr-2" />
                                                Send Notification
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {selectedItem.legalCompliance && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Legal Compliance</h3>
                                    <Card className="glass-card border-white/5 bg-white/5">
                                        <CardContent className="p-4 space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-slate-400">Retention Period</span>
                                                <span className="font-medium text-white">{selectedItem.legalCompliance.retentionPeriod} days</span>
                                            </div>
                                            {selectedItem.legalCompliance.disposalDate && (
                                                <>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-400">Disposal Date</span>
                                                        <span className="font-medium text-white">
                                                            {new Date(selectedItem.legalCompliance.disposalDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-400">Disposal Method</span>
                                                        <span className="font-medium text-white">{selectedItem.legalCompliance.disposalMethod}</span>
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {category === 'Weapons' && (
                                <div>
                                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Manager Approval</h3>
                                    {selectedItem.managerApproved === false ? (
                                        <Card className="bg-red-500/10 border-red-500/30">
                                            <CardContent className="p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <i className="fas fa-exclamation-triangle text-red-500" />
                                                    <span className="font-bold text-red-400">⚠️ Pending Manager Review</span>
                                                </div>
                                                <p className="text-sm text-red-300 mb-3">
                                                    This item requires manager approval before it can be processed or released.
                                                </p>
                                                <Button
                                                    className="w-full bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-lg shadow-red-500/20"
                                                    onClick={() => {
                                                        // In real implementation, this would trigger a manager approval workflow
                                                        onClose();
                                                    }}
                                                >
                                                    <i className="fas fa-user-shield mr-2" />
                                                    Request Manager Approval
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ) : selectedItem.managerApproved === true ? (
                                        <Card className="bg-green-500/10 border-green-500/30">
                                            <CardContent className="p-4">
                                                <div className="flex items-center space-x-2 mb-2">
                                                    <i className="fas fa-check-circle text-green-500" />
                                                    <span className="font-bold text-green-400">✓ Approved</span>
                                                </div>
                                                {selectedItem.managerApprovedBy && (
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-green-300">Approved By:</span>
                                                            <span className="font-medium text-white">{selectedItem.managerApprovedBy}</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-green-300">Date:</span>
                                                            <span className="font-medium text-white">{selectedItem.managerApprovedDate}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </CardContent>
                                        </Card>
                                    ) : null}
                                </div>
                            )}

                            {/* Quick Actions */}
                            <div className="space-y-2">
                                {selectedItem.status === LostFoundStatus.FOUND && (
                                    <Button
                                        variant="primary"
                                        className="w-full bg-green-600 hover:bg-green-500 text-white font-bold"
                                        onClick={handleClaimItem}
                                        disabled={loading.items}
                                    >
                                        <i className="fas fa-check mr-2" />
                                        Mark as Claimed
                                    </Button>
                                )}
                                {selectedItem.status === LostFoundStatus.EXPIRED && (
                                    <Button
                                        variant="primary"
                                        className="w-full bg-slate-600 hover:bg-slate-500 text-white font-bold"
                                        onClick={handleArchiveItem}
                                        disabled={loading.items}
                                    >
                                        <i className="fas fa-archive mr-2" />
                                        Archive Item
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="w-full border-white/5 text-slate-300 hover:bg-white/5 uppercase tracking-wider font-bold"
                                    onClick={() => {
                                        // Print QR code functionality
                                        onClose();
                                    }}
                                >
                                    <i className="fas fa-print mr-2" />
                                    Print QR Code
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};




