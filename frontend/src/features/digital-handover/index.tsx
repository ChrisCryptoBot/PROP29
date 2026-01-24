/**
 * Digital Handover Module - Main Entry Point
 * 
 * This module provides digital handover management functionality for security operations.
 * 
 * Features:
 * - Handover creation, editing, and completion
 * - Dual-officer verification and signatures
 * - Equipment and maintenance tracking
 * - Analytics and reporting
 * - Configurable settings and templates
 * - Draft resilience with IndexedDB
 * - Incident linkage
 * - Media attachments
 * - Operational post support
 */

// Main module component (router export)
export { DigitalHandoverModule as default, DigitalHandoverModule } from './DigitalHandoverModule';

// Context
export { HandoverProvider, useHandoverContext, type HandoverContextValue } from './context/HandoverContext';

// Types
export * from './types';

// Constants
export * from './utils/constants';

// Components
export * from './components';

// Hooks
export * from './hooks';

// Services
export * from './services';

