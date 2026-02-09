/**
 * Analytics Tab
 * Package analytics and reports — deliverability and ownership focus
 */

import React, { useMemo } from 'react';
import { usePackageContext } from '../../context/PackageContext';
import { PackageStatus } from '../../types/package.types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export const AnalyticsTab: React.FC = React.memo(() => {
    const { packages } = usePackageContext();

    const metrics = useMemo(() => {
        const delivered = packages.filter(p => p.status === PackageStatus.DELIVERED);
        const withHandlingTime = delivered.filter(p => p.received_at && p.delivered_at);
        const totalHours = withHandlingTime.reduce((sum, p) => {
            const received = new Date(p.received_at!).getTime();
            const deliveredAt = new Date(p.delivered_at!).getTime();
            return sum + (deliveredAt - received) / (60 * 60 * 1000);
        }, 0);
        const avgHours = withHandlingTime.length > 0 ? (totalHours / withHandlingTime.length).toFixed(1) : '—';
        const eligible = packages.filter(p => p.status === PackageStatus.DELIVERED || p.status === PackageStatus.EXPIRED).length;
        const deliveryRate = eligible > 0 ? Math.round((delivered.length / eligible) * 100) : 0;
        return {
            total: packages.length,
            received: packages.filter(p => p.status === PackageStatus.RECEIVED).length,
            notified: packages.filter(p => p.status === PackageStatus.NOTIFIED).length,
            delivered: delivered.length,
            expired: packages.filter(p => p.status === PackageStatus.EXPIRED).length,
            pendingDelivery: packages.filter(p => p.status === PackageStatus.RECEIVED || p.status === PackageStatus.NOTIFIED).length,
            deliveryRate,
            avgHandlingHours: avgHours,
        };
    }, [packages]);

    const statusChartData = useMemo(() => [
        { name: 'Delivered', value: metrics.delivered, color: '#10b981' },
        { name: 'Pending', value: metrics.pendingDelivery, color: '#3b82f6' },
        { name: 'Expired', value: metrics.expired, color: '#f59e0b' },
    ].filter(d => d.value > 0), [metrics]);

    return (
        <div className="space-y-6 pt-12">
            {/* Gold Standard Page Header */}
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h2 className="page-title">Analytics & Reports</h2>
                    <p className="text-[10px] font-bold text-[color:var(--text-sub)] uppercase tracking-[0.2em] mt-1 italic">
                        Package deliverability and ownership metrics
                    </p>
                </div>
            </div>

            {/* Compact metrics bar (gold standard — no KPI cards) */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-bold uppercase tracking-widest text-[color:var(--text-sub)] mb-6" role="group" aria-label="Package analytics metrics">
                <span>Delivery Rate <strong className="font-black text-white">{metrics.deliveryRate}%</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Avg Handling <strong className="font-black text-white">{metrics.avgHandlingHours}h</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Delivered <strong className="font-black text-white">{metrics.delivered}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Total <strong className="font-black text-white">{metrics.total}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Pending <strong className="font-black text-white">{metrics.pendingDelivery}</strong></span>
                <span className="text-white/30" aria-hidden="true">|</span>
                <span>Expired <strong className="font-black text-white">{metrics.expired}</strong></span>
            </div>

            <section aria-labelledby="analytics-reports-heading">
                <h3 id="analytics-reports-heading" className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center border border-white/5 mr-3">
                        <i className="fas fa-chart-bar text-white text-lg" aria-hidden="true" />
                    </div>
                    Delivery Status
                </h3>
                <div className="rounded-md border border-white/5 p-6">
                        {/* Status distribution */}
                        <div>
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">Delivery Status</h3>
                            {statusChartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie
                                            data={statusChartData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                            nameKey="name"
                                            label={({ name, value }) => `${name}: ${value}`}
                                        >
                                            {statusChartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0.2)" />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#0f172a',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#cbd5e1'
                                            }}
                                        />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-slate-400 text-center py-8">No package data yet. Delivery status will appear here.</p>
                            )}
                        </div>
                </div>
            </section>
        </div>
    );
});

AnalyticsTab.displayName = 'AnalyticsTab';

