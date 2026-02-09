import React, { useState, useEffect } from 'react';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { useSystemAdminContext } from '../../context/SystemAdminContext';

const MODULES = ['Overview', 'Users', 'Roles', 'Properties', 'Security', 'System', 'Audit'];
const ROLE_COLUMNS = ['Administrator', 'Staff Ops', 'Read Only'];
const ACCESS_OPTIONS = ['Total Access', 'Operational', 'Restricted', 'Audit', 'Denied'];

export const ModifyMatrixModal: React.FC = () => {
    const {
        showModifyMatrixModal,
        setShowModifyMatrixModal,
        permissionMatrix,
        setPermissionMatrix,
        handleSavePermissionMatrix,
    } = useSystemAdminContext();

    const [localMatrix, setLocalMatrix] = useState<Record<string, Record<string, string>>>({});

    useEffect(() => {
        if (showModifyMatrixModal) {
            setLocalMatrix(JSON.parse(JSON.stringify(permissionMatrix)));
        }
    }, [showModifyMatrixModal, permissionMatrix]);

    if (!showModifyMatrixModal) return null;

    const setCell = (module: string, role: string, value: string) => {
        setLocalMatrix(prev => ({
            ...prev,
            [module]: {
                ...(prev[module] ?? {}),
                [role]: value,
            },
        }));
    };

    const handleSave = () => {
        handleSavePermissionMatrix(localMatrix);
    };

    const handleClose = () => {
        setShowModifyMatrixModal(false);
    };

    return (
        <Modal
            isOpen={showModifyMatrixModal}
            onClose={handleClose}
            title="Modify permissions matrix"
            size="lg"
            footer={
                <>
                    <Button variant="subtle" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleSave}>
                        Save matrix
                    </Button>
                </>
            }
        >
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-white/10 bg-white/5">
                            <th className="text-left py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">Module</th>
                            {ROLE_COLUMNS.map(role => (
                                <th key={role} className="text-center py-3 px-4 font-bold text-slate-400 uppercase tracking-wider">{role}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {MODULES.map(module => (
                            <tr key={module} className="hover:bg-white/5">
                                <td className="py-3 px-4 font-medium text-white">{module}</td>
                                {ROLE_COLUMNS.map(role => (
                                    <td key={role} className="py-2 px-4 text-center">
                                        <select
                                            value={localMatrix[module]?.[role] ?? (role === 'Administrator' ? 'Total Access' : 'Denied')}
                                            onChange={(e) => setCell(module, role, e.target.value)}
                                            className="w-full max-w-[10rem] mx-auto px-2 py-1.5 bg-white/5 border border-white/10 rounded text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                                        >
                                            {ACCESS_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
};
