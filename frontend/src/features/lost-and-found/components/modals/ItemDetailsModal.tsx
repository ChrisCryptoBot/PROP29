/**
 * Item Details Modal
 * Displays comprehensive information about a lost & found item. Uses global Modal (UI gold standard).
 */

import React, { useState } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { Avatar } from '../../../../components/UI/Avatar';
import { useLostFoundContext } from '../../context/LostFoundContext';
import { LostFoundStatus } from '../../types/lost-and-found.types';

const inputClass =
  'w-full px-3 py-2 bg-white/5 border border-white/5 rounded-md text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white/10 placeholder-slate-500';

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
    archiveItem,
    updateItem,
  } = useLostFoundContext();
  const [managerConfirmId, setManagerConfirmId] = useState('');
  const [managerConfirming, setManagerConfirming] = useState(false);
  const [claimerName, setClaimerName] = useState('');
  const [claimerContact, setClaimerContact] = useState('');

  if (!selectedItem) return null;

    const getStatusBadgeClass = (status: string) => {
        switch (status.toLowerCase()) {
            case 'found': return 'text-blue-300 bg-blue-500/20 border border-blue-500/30';
            case 'claimed': return 'text-green-300 bg-green-500/20 border border-green-500/30';
            case 'expired': return 'text-amber-300 bg-amber-500/20 border border-amber-500/30';
            case 'donated': return 'text-indigo-300 bg-indigo-500/20 border border-indigo-500/30';
            default: return 'text-slate-300 bg-slate-500/20 border border-slate-500/30';
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
            claimer_name: claimerName.trim() || 'Guest',
            claimer_contact: claimerContact.trim(),
            description: 'Item claimed'
        });
        onClose();
    };

    const handleArchiveItem = async () => {
        await archiveItem(selectedItem.item_id);
        onClose();
    };

    const handleManagerConfirmNotified = async () => {
        const id = managerConfirmId.trim();
        if (!id) return;
        setManagerConfirming(true);
        try {
            const result = await updateItem(selectedItem.item_id, {
                managerApproved: true,
                managerApprovedBy: id,
                managerApprovedDate: new Date().toISOString()
            });
            if (result) {
                setManagerConfirmId('');
                setManagerConfirming(false);
            }
        } catch {
            setManagerConfirming(false);
        }
    };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={itemName}
      size="lg"
      footer={<Button variant="subtle" onClick={onClose}>Cancel</Button>}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Item information</p>
            <div className="space-y-2">
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Category</span><span className="text-white font-bold">{category}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Status</span><span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getStatusBadgeClass(selectedItem.status)}`}>{selectedItem.status}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Value</span><span className="text-white font-bold">{value ? `$${value}` : '—'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Date found</span><span className="text-white font-bold">{new Date(dateFound).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Location</span><span className="text-white font-bold">{location}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Storage</span><span className="text-white font-bold">{storageLocation}</span></div>
              <div className="flex justify-between"><span className="text-slate-500 text-sm">Expires</span><span className="text-white font-bold">{new Date(expirationDate).toLocaleDateString()}</span></div>
            </div>
          </div>
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Description</p>
            <p className="text-sm text-slate-300">{selectedItem.description || '—'}</p>
          </div>
          {selectedItem.qrCode && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">QR code</p>
              <div className="p-4 bg-white/5 border border-white/5 rounded-md text-center">
                <i className="fas fa-qrcode text-4xl text-slate-400 mb-2 block" />
                <p className="text-xs font-mono text-slate-400">{selectedItem.qrCode}</p>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {selectedItem.guestInfo && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Guest</p>
              <div className="flex items-center space-x-3 p-4 bg-white/5 border border-white/5 rounded-md">
                <Avatar className="w-10 h-10 border border-white/5">
                  <div className="w-full h-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {selectedItem.guestInfo.name.charAt(0)}
                  </div>
                </Avatar>
                <div>
                  <p className="font-bold text-white">{selectedItem.guestInfo.name}</p>
                  <p className="text-sm text-slate-400">Room {selectedItem.guestInfo.room}</p>
                  <p className="text-xs text-slate-500">{selectedItem.guestInfo.phone} · {selectedItem.guestInfo.email}</p>
                </div>
              </div>
            </div>
          )}
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Notifications</p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Sent</span><span className="text-white font-bold">{selectedItem.notificationsSent || 0}</span></div>
              {selectedItem.lastNotificationDate && <div className="flex justify-between text-sm"><span className="text-slate-500">Last</span><span className="text-white text-sm">{new Date(selectedItem.lastNotificationDate).toLocaleString()}</span></div>}
              {selectedItem.status === LostFoundStatus.FOUND && selectedItem.guestInfo && (
                <Button variant="primary" className="w-full mt-2" onClick={handleNotifyGuest} disabled={loading.items}>Send notification</Button>
              )}
            </div>
          </div>
          {selectedItem.legalCompliance && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Legal</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Retention</span><span className="text-white font-bold">{selectedItem.legalCompliance.retentionPeriod} days</span></div>
                {selectedItem.legalCompliance.disposalDate && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Disposal</span><span className="text-white font-bold">{new Date(selectedItem.legalCompliance.disposalDate).toLocaleDateString()}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Method</span><span className="text-white font-bold">{selectedItem.legalCompliance.disposalMethod}</span></div>
                  </>
                )}
              </div>
            </div>
          )}
          {category === 'Weapons' && (
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">Manager</p>
              {selectedItem.managerApproved === false ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md space-y-3">
                  <p className="text-sm text-red-300">Manager must confirm they were notified. Enter employee ID below.</p>
                  <input type="text" value={managerConfirmId} onChange={(e) => setManagerConfirmId(e.target.value)} placeholder="Employee ID" className={inputClass} />
                  <Button variant="destructive" className="w-full" onClick={handleManagerConfirmNotified} disabled={!managerConfirmId.trim() || managerConfirming}>
                    {managerConfirming ? 'Confirming…' : 'Confirm I was notified'}
                  </Button>
                </div>
              ) : selectedItem.managerApproved === true ? (
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-md text-sm text-green-400">
                  Manager notified{selectedItem.managerApprovedBy ? ` by ${selectedItem.managerApprovedBy}` : ''}.
                </div>
              ) : null}
            </div>
          )}
          <div className="space-y-2">
            {selectedItem.status === LostFoundStatus.FOUND && (
              <>
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Claimer name</label>
                <input
                  type="text"
                  value={claimerName}
                  onChange={(e) => setClaimerName(e.target.value)}
                  placeholder="Guest or claimant name"
                  className={inputClass}
                />
                <label className="block text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Contact (optional)</label>
                <input
                  type="text"
                  value={claimerContact}
                  onChange={(e) => setClaimerContact(e.target.value)}
                  placeholder="Phone or email"
                  className={inputClass}
                />
                <Button variant="primary" className="w-full" onClick={handleClaimItem} disabled={loading.items}>Mark as claimed</Button>
              </>
            )}
            {selectedItem.status === LostFoundStatus.EXPIRED && (
              <Button variant="primary" className="w-full bg-slate-600 hover:bg-slate-500" onClick={handleArchiveItem} disabled={loading.items}>Archive item</Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};




