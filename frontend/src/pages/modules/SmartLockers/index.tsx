/**
 * Smart Lockers Module - Router Entry Point
 * Re-exports the refactored orchestrator component
 */

import React from 'react';
import { SmartLockersOrchestrator } from '../../../features/smart-lockers';

const SmartLockers: React.FC = () => {
  return <SmartLockersOrchestrator />;
};

export default SmartLockers;

