import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import type { ContactInfo } from '../../types';
import { EMERGENCY_PHONE } from '../../constants/seedData';

interface ContactSupportTabProps {
  contactInfo: ContactInfo[];
  emergencyPhone: string;
}

function telUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.startsWith('1') && digits.length === 11 ? `tel:+${digits}` : `tel:${digits}`;
}

export const ContactSupportTab: React.FC<ContactSupportTabProps> = ({
  contactInfo,
  emergencyPhone
}) => {
  return (
    <div className="space-y-6" role="main" aria-label="Contact Support">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Contact Support</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Reach the support team by email or phone
          </p>
        </div>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
              <i className="fas fa-headset text-white" />
            </div>
            <span className="card-title-text">Support Team</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {contactInfo.map((contact, index) => (
              <div
                key={index}
                className="p-4 rounded-lg border border-white/5 bg-white/[0.02]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 shrink-0">
                    <i className="fas fa-user text-white" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white truncate">{contact.name}</h4>
                    <p className="text-sm text-slate-400 truncate">{contact.role}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-envelope text-slate-500 shrink-0" aria-hidden />
                    <span className="text-slate-400 truncate">{contact.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-phone text-slate-500 shrink-0" aria-hidden />
                    <span className="text-slate-400">{contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-clock text-slate-500 shrink-0" aria-hidden />
                    <span className="text-slate-400 text-xs">{contact.availability}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-2">
                    Specialties
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {contact.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] rounded border border-blue-500/20"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  <a
                    href={`mailto:${contact.email}`}
                    className="inline-flex items-center justify-center h-8 px-3 text-xs rounded-md font-medium bg-blue-600 text-white border border-blue-600 hover:bg-blue-500 transition-colors"
                  >
                    <i className="fas fa-envelope mr-1" aria-hidden />
                    Email
                  </a>
                  <a
                    href={telUrl(contact.phone)}
                    className="inline-flex items-center justify-center h-8 px-3 text-xs rounded-md font-medium border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <i className="fas fa-phone mr-1" aria-hidden />
                    Call
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border border-red-500/20 border-l-4 border-l-red-500">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center text-red-400">
            <div className="w-10 h-10 bg-red-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
              <i className="fas fa-exclamation-triangle text-white" />
            </div>
            <span className="card-title-text">Emergency Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h4 className="font-semibold text-white">24/7 Emergency Hotline</h4>
              <p className="text-slate-400 text-sm mt-1">
                For critical system failures or security emergencies
              </p>
              <p className="text-red-400 font-mono font-medium mt-2">{emergencyPhone}</p>
            </div>
            <a
              href={telUrl(emergencyPhone)}
              className="inline-flex items-center justify-center h-10 py-2 px-4 text-sm rounded-md font-medium bg-red-600 hover:bg-red-700 text-white border-0 transition-colors"
            >
              <i className="fas fa-phone mr-2" aria-hidden />
              Call Now
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
