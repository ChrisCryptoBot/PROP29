/**
 * Certifications tab — Gold Standard (Patrol card header pattern).
 * CardTitle contains left-aligned icon+title and Add Certification button.
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { useProfileSettingsContext } from '../../context/ProfileSettingsContext';
import type { Certification } from '../../types/profile-settings.types';
import { AddCertificationModal } from '../modals/AddCertificationModal';
import { EditCertificationModal } from '../modals/EditCertificationModal';
import { ConfirmRemoveCertificationModal } from '../modals/ConfirmRemoveCertificationModal';

function certStatus(expiryDate: string): 'active' | 'expired' | 'pending' {
  const exp = new Date(expiryDate).getTime();
  const now = Date.now();
  if (exp < now) return 'expired';
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (exp - now < thirtyDays) return 'pending';
  return 'active';
}

export const CertificationsTab: React.FC = () => {
  const { profile } = useProfileSettingsContext();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCert, setEditCert] = useState<Certification | null>(null);
  const [removeCert, setRemoveCert] = useState<Certification | null>(null);
  const certifications = profile.certifications || [];

  return (
    <div className="space-y-6 pt-8" role="main" aria-label="Certifications">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Certifications</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Training and certifications
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center text-white">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5">
                <i className="fas fa-certificate text-white" aria-hidden />
              </div>
              <span className="card-title-text">Certifications & Training</span>
            </span>
            <Button variant="primary" onClick={() => setShowAddModal(true)} aria-label="Add certification">
              <i className="fas fa-plus mr-2" aria-hidden />
              Add Certification
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 py-6">
          {certifications.length === 0 ? (
            <EmptyState
              icon="fas fa-certificate"
              title="No Certifications"
              description="Add your first certification or training record."
              action={{ label: 'Add Certification', onClick: () => setShowAddModal(true) }}
            />
          ) : (
            <div className="space-y-3">
              {certifications.map((cert) => {
                const status = cert.status || certStatus(cert.expiryDate);
                return (
                  <div
                    key={cert.id}
                    className="rounded-lg border border-white/10 p-4 bg-white/[0.02]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-black text-white text-sm uppercase tracking-widest">{cert.name}</h4>
                        <p className="text-sm text-[color:var(--text-sub)]">Issued by: {cert.issuer}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            status === 'active' ? 'success' : status === 'expired' ? 'destructive' : 'warning'
                          }
                        >
                          {status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditCert(cert)}
                          aria-label={`Edit ${cert.name}`}
                        >
                          <i className="fas fa-edit" aria-hidden />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setRemoveCert(cert)}
                          aria-label={`Remove ${cert.name}`}
                          className="text-red-400 hover:text-red-300"
                        >
                          <i className="fas fa-trash" aria-hidden />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Issue Date: </span>
                        <span className="text-white">{new Date(cert.issueDate).toLocaleDateString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Expiry Date: </span>
                        <span className="text-white">{new Date(cert.expiryDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    {status === 'expired' && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[10px] font-black uppercase tracking-widest">
                        <i className="fas fa-exclamation-triangle mr-2" aria-hidden />
                        This certification has expired and needs to be renewed.
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AddCertificationModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => setShowAddModal(false)}
      />
      <EditCertificationModal
        isOpen={!!editCert}
        onClose={() => setEditCert(null)}
        certification={editCert}
        onSuccess={() => setEditCert(null)}
      />
      <ConfirmRemoveCertificationModal
        isOpen={!!removeCert}
        onClose={() => setRemoveCert(null)}
        certification={removeCert}
        onSuccess={() => setRemoveCert(null)}
      />
    </div>
  );
};
