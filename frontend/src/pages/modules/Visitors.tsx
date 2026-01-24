/**
 * Visitor Security Module
 * Entry point for the Visitor Security module
 * Now uses the Gold Standard orchestrator architecture
 */

import React from 'react';
import VisitorSecurityModuleOrchestrator from '../../features/visitor-security/VisitorSecurityModuleOrchestrator';

const Visitors: React.FC = () => {
  return <VisitorSecurityModuleOrchestrator />;
};

export default Visitors;

