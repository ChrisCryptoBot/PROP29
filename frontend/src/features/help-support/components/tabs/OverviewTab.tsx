import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/UI/Card';
import { Button } from '../../../../components/UI/Button';
import { Badge } from '../../../../components/UI/Badge';
import { getStatusBadgeVariant, getPriorityBadgeVariant } from '../../utils/helpSupportHelpers';
import type { SupportTicket } from '../../types';

interface OverviewTabProps {
  helpArticlesCount: number;
  openTicketsCount: number;
  supportAgentsCount: number;
  recentTickets: SupportTicket[];
  setActiveTab: (tab: string) => void;
  openNewTicketModal: () => void;
  openTicketDetail: (ticket: SupportTicket) => void;
  openContactTab: () => void;
  openLiveChatOrShowComingSoon: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  helpArticlesCount,
  openTicketsCount,
  supportAgentsCount,
  recentTickets,
  setActiveTab,
  openNewTicketModal,
  openTicketDetail,
  openContactTab,
  openLiveChatOrShowComingSoon
}) => {
  return (
    <div className="space-y-6" role="main" aria-label="Help & Support Overview">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="page-title">Overview</h2>
          <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
            Quick access to help, tickets, and support
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-6 py-3 border-b border-white/5 text-sm mb-6">
        <span className="text-slate-400 font-medium">
          Help Articles <strong className="text-white ml-1">{helpArticlesCount}</strong>
        </span>
        <span className="text-slate-400 font-medium">
          Open Tickets <strong className="text-white ml-1">{openTicketsCount}</strong>
        </span>
        <span className="text-slate-400 font-medium">
          Support Agents <strong className="text-white ml-1">{supportAgentsCount}</strong>
        </span>
        <span className="text-slate-400 font-medium">
          Avg Response <strong className="text-white ml-1">&lt;2h</strong>
        </span>
      </div>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                <i className="fas fa-bolt text-white" />
              </div>
              <span className="card-title-text">Quick Actions</span>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-16 flex-col" onClick={() => setActiveTab('help')}>
              <i className="fas fa-search text-xl mb-2" aria-hidden />
              Search Help
            </Button>
            <Button variant="outline" className="h-16 flex-col" onClick={openNewTicketModal}>
              <i className="fas fa-plus text-xl mb-2" aria-hidden />
              New Ticket
            </Button>
            <Button variant="outline" className="h-16 flex-col" onClick={openContactTab}>
              <i className="fas fa-phone text-xl mb-2" aria-hidden />
              Contact Support
            </Button>
            <Button variant="outline" className="h-16 flex-col" onClick={openLiveChatOrShowComingSoon}>
              <i className="fas fa-comments text-xl mb-2" aria-hidden />
              Live Chat
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900/50 border border-white/5">
        <CardHeader className="border-b border-white/5 pb-4 px-6 pt-6">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center mr-3 border border-white/5" aria-hidden>
                <i className="fas fa-ticket-alt text-white" />
              </div>
              <span className="card-title-text">Recent Support Tickets</span>
            </CardTitle>
            <Button variant="outline" onClick={() => setActiveTab('tickets')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-3">
            {recentTickets.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No tickets yet. Create one from Quick Actions.</p>
            ) : (
              recentTickets.slice(0, 3).map((ticket) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h4 className="font-semibold text-white truncate">{ticket.title}</h4>
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
                      <Badge variant={getPriorityBadgeVariant(ticket.priority)}>{ticket.priority}</Badge>
                    </div>
                    <p className="text-sm text-slate-400 line-clamp-1">{ticket.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openTicketDetail(ticket)}>
                    <i className="fas fa-eye mr-1" aria-hidden />
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
