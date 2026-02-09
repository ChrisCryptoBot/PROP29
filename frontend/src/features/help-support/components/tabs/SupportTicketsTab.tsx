import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { EmptyState } from '../../../../components/UI/EmptyState';
import { getStatusBadgeVariant, getPriorityBadgeVariant, formatTicketCategory } from '../../utils/helpSupportHelpers';
import type { SupportTicket } from '../../types';

interface SupportTicketsTabProps {
  tickets: SupportTicket[];
  openNewTicketModal: () => void;
  openTicketDetail: (ticket: SupportTicket) => void;
}

export const SupportTicketsTab: React.FC<SupportTicketsTabProps> = ({
  tickets,
  openNewTicketModal,
  openTicketDetail
}) => {
  return (
    <div className="space-y-6" role="main" aria-label="Support Tickets">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Support Tickets</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Create and manage support requests
          </p>
        </div>
        <Button onClick={openNewTicketModal}>
          <i className="fas fa-plus mr-2" aria-hidden />
          New Ticket
        </Button>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
              <i className="fas fa-ticket-alt text-white" />
            </div>
            <span className="card-title-text">All Tickets</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {tickets.length === 0 ? (
            <EmptyState
              icon="fas fa-ticket-alt"
              title="No support tickets"
              description="Create a ticket to get help from the support team."
              action={{ label: 'New Ticket', onClick: openNewTicketModal }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Ticket
                    </th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-[9px] font-black uppercase tracking-widest text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-white/[0.02]">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-white">{ticket.title}</div>
                          <div className="text-[10px] text-slate-500">{ticket.id}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {formatTicketCategory(ticket.category)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openTicketDetail(ticket)} title="View">
                            <i className="fas fa-eye" aria-hidden />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
