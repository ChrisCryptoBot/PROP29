/**
 * Sound Monitoring Module
 * Main entry point - delegates to orchestrator
 */

import React from 'react';
import { SoundMonitoringOrchestrator } from '../../features/sound-monitoring';

const SoundMonitoring: React.FC = () => {
  return <SoundMonitoringOrchestrator />;
};

export default SoundMonitoring;

