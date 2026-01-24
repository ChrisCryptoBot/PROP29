/**
 * Packages Module
 * Main entry point for Package Management module
 * Uses Gold Standard architecture with orchestrator pattern
 */

import PackageModuleOrchestrator from '../../features/packages/PackageModuleOrchestrator';

const Packages: React.FC = () => {
    return <PackageModuleOrchestrator />;
};

export default Packages;

