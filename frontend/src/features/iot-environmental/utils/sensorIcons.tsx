import React from 'react';
import type { SensorType } from '../types/iot-environmental.types';

export function renderSensorIcon(type: SensorType, size = 20): JSX.Element {
  const iconStyle = { fontSize: size };
  switch (type) {
    case 'temperature':
      return <i className="fas fa-thermometer-half text-red-600" style={iconStyle} />;
    case 'humidity':
      return <i className="fas fa-tint text-blue-600" style={iconStyle} />;
    case 'air_quality':
      return <i className="fas fa-wind text-green-600" style={iconStyle} />;
    case 'light':
      return <i className="fas fa-sun text-yellow-600" style={iconStyle} />;
    case 'noise':
      return <i className="fas fa-volume-up text-purple-600" style={iconStyle} />;
    case 'pressure':
      return <i className="fas fa-tachometer-alt text-indigo-600" style={iconStyle} />;
    default:
      return <i className="fas fa-wave-square text-slate-600" style={iconStyle} />;
  }
}

