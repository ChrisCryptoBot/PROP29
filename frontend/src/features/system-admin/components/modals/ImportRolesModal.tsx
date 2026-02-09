import React, { useState, useRef } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';
import type { SystemRole } from '../../types/system-admin.types';

type BadgeVariant = 'destructive' | 'success' | 'secondary' | 'outline';

const parseCSV = (text: string): Array<Record<string, string>> => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
    const rows: Array<Record<string, string>> = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, j) => { row[h] = values[j] ?? ''; });
        rows.push(row);
    }
    return rows;
};

const mapRowToRole = (row: Record<string, string>): { title: string; description: string; permissions: string; modules: string; badge: string; badgeVariant: BadgeVariant } => {
    const title = (row.title || row.name || row.role || '').trim();
    const description = (row.description || '').trim();
    const permissions = (row.permissions || 'Limited (75%)').trim();
    const modules = (row.modules || 'All').trim();
    const badge = (row.badge || 'Standard').trim();
    const badgeVariant: BadgeVariant = (row.badgevariant === 'destructive' || badge === 'Restricted') ? 'destructive'
        : (badge === 'Active') ? 'success' : 'secondary';
    return { title, description, permissions, modules, badge, badgeVariant };
};

export const ImportRolesModal: React.FC = () => {
    const {
        showImportRolesModal,
        setShowImportRolesModal,
        handleImportRoles,
        showError,
    } = useSystemAdminContext();

    const [parseError, setParseError] = useState<string | null>(null);
    const [preview, setPreview] = useState<Array<{ title: string; description: string; permissions: string; modules: string; badge: string }>>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!showImportRolesModal) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        setParseError(null);
        setPreview([]);
        if (!file) return;

        const isJSON = file.name.toLowerCase().endsWith('.json');
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = String(reader.result ?? '');
                if (isJSON) {
                    const data = JSON.parse(text);
                    const arr = Array.isArray(data) ? data : (data.roles ?? data.items ?? []);
                    const mapped = arr.map((r: Record<string, unknown>) => ({
                        title: String(r.title ?? r.name ?? '').trim(),
                        description: String(r.description ?? '').trim(),
                        permissions: String(r.permissions ?? 'Limited (75%)').trim(),
                        modules: String(r.modules ?? 'All').trim(),
                        badge: String(r.badge ?? 'Standard').trim(),
                    })).filter((r: { title: string }) => r.title);
                    setPreview(mapped);
                } else {
                    const rows = parseCSV(text);
                    const mapped = rows.map(mapRowToRole).filter(r => r.title);
                    setPreview(mapped.map(r => ({ title: r.title, description: r.description, permissions: r.permissions, modules: r.modules, badge: r.badge })));
                }
            } catch (err) {
                setParseError(err instanceof Error ? err.message : 'Invalid file format');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const handleConfirmImport = () => {
        if (preview.length === 0) {
            showError('No valid roles to import. Upload a CSV or JSON file with at least a "title" or "name" column.');
            return;
        }
        const toImport = preview.map(p => ({
            title: p.title,
            description: p.description,
            permissions: p.permissions,
            modules: p.modules,
            badge: p.badge,
            badgeVariant: (p.badge === 'Restricted' ? 'destructive' : p.badge === 'Active' ? 'success' : 'secondary') as BadgeVariant,
        }));
        handleImportRoles(toImport);
        setPreview([]);
        setParseError(null);
    };

    const handleClose = () => {
        setShowImportRolesModal(false);
        setPreview([]);
        setParseError(null);
    };

    return (
        <Modal
            isOpen={showImportRolesModal}
            onClose={handleClose}
            title="Import roles"
            size="md"
            footer={
                <>
                    <Button variant="subtle" onClick={handleClose}>
                        Cancel
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.json"
                        className="hidden"
                        onChange={handleFileChange}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                        <i className="fas fa-upload mr-2" aria-hidden />
                        Choose file
                    </Button>
                    <Button variant="primary" onClick={handleConfirmImport} disabled={preview.length === 0}>
                        Import {preview.length > 0 ? `${preview.length} role(s)` : 'roles'}
                    </Button>
                </>
            }
        >
            <div className="space-y-4">
                <p className="text-sm text-slate-400">
                    Upload a CSV or JSON file. CSV must have a header row with columns: <code className="text-white/80">title</code> (or <code className="text-white/80">name</code>), and optionally <code className="text-white/80">description</code>, <code className="text-white/80">permissions</code>, <code className="text-white/80">modules</code>, <code className="text-white/80">badge</code>.
                </p>
                {parseError && (
                    <p className="text-sm text-red-400 font-medium">{parseError}</p>
                )}
                {preview.length > 0 && (
                    <div className="border border-white/10 rounded-md overflow-hidden">
                        <div className="bg-white/5 px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Preview — {preview.length} role(s)
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="text-left py-2 px-3 text-slate-500">Title</th>
                                        <th className="text-left py-2 px-3 text-slate-500">Description</th>
                                        <th className="text-left py-2 px-3 text-slate-500">Badge</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 10).map((r, i) => (
                                        <tr key={i} className="border-b border-white/5">
                                            <td className="py-2 px-3 text-white">{r.title}</td>
                                            <td className="py-2 px-3 text-slate-400 truncate max-w-[12rem]">{r.description || '—'}</td>
                                            <td className="py-2 px-3 text-slate-400">{r.badge}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {preview.length > 10 && (
                                <p className="px-3 py-2 text-xs text-slate-500">… and {preview.length - 10} more</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
