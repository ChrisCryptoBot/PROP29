import React from 'react';
import { cn } from '../../../../utils/cn';
import { useEmergencyEvacuationContext } from '../../context/EmergencyEvacuationContext';

const RouteDetailsModal: React.FC = () => {
  const { selectedRoute, setShowRouteModal } = useEmergencyEvacuationContext();

  if (!selectedRoute) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <i className="fas fa-route mr-3 text-blue-600"></i>
            {selectedRoute.name}
          </h2>
          <button
            onClick={() => setShowRouteModal(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Route Status</h3>
            <span
              className={cn(
                'badge capitalize text-lg px-4 py-2',
                selectedRoute.status === 'clear' ? 'badge-glass' :
                selectedRoute.status === 'congested' ? 'badge-warning' :
                'badge-danger'
              )}
            >
              {selectedRoute.status}
            </span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600">{selectedRoute.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Capacity</h3>
              <p className="text-2xl font-bold text-slate-900">{selectedRoute.capacity}</p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">Current Occupancy</h3>
              <p className="text-2xl font-bold text-slate-900">{selectedRoute.currentOccupancy}</p>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Capacity Utilization</h3>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-600 to-blue-700 h-full rounded-full transition-all duration-500"
                style={{ width: `${(selectedRoute.currentOccupancy / selectedRoute.capacity) * 100}%` }}
              ></div>
            </div>
            <p className="text-sm text-slate-600 mt-1">
              {Math.round((selectedRoute.currentOccupancy / selectedRoute.capacity) * 100)}% utilized
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Estimated Evacuation Time</h3>
            <p className="text-lg font-bold text-slate-900">{selectedRoute.estimatedTime}</p>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 mb-2">Serves Floors</h3>
            <div className="flex flex-wrap gap-2">
              {selectedRoute.floors.map((floor, index) => (
                <span key={index} className="badge badge-outline">{floor}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowRouteModal(false)}
            className="btn btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailsModal;

