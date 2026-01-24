import { SystemAdminOrchestrator } from '../../features/system-admin';

/**
 * System Administration Module Entry Point
 * 
 * This module has been refactored into a modular feature structure located at 
 * src/features/system-admin following the "Gold Standard" architecture.
 * logic, state, and UI components are extracted for maintainability and scalability.
 */
const SystemAdministration = () => {
  return <SystemAdminOrchestrator />;
};

export default SystemAdministration;

