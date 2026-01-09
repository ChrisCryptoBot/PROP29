import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../UI/Card';
import { Button } from '../UI/Button';
import { Badge } from '../UI/Badge';
import { showLoading, dismissLoadingAndShowSuccess, showError, showSuccess } from '../../utils/toast';
import { patrolAI } from '../../services/PatrolAIService';
import '../../styles/modern-glass.css';

interface Route {
  id: string;
  name: string;
  checkpoints: Checkpoint[];
  estimatedDuration: string;
  performanceScore: number;
}

interface Checkpoint {
  id: string;
  name: string;
  location: string;
  coordinates: { lat: number; lng: number };
  estimatedTime: number;
  isCritical: boolean;
}

interface Props {
  selectedRoute: Route | null;
  onApplyOptimization?: (optimizedSequence: string[]) => void;
}

export const RouteOptimizationPanel: React.FC<Props> = ({ selectedRoute, onApplyOptimization }) => {
  const [optimization, setOptimization] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  const handleOptimize = async () => {
    if (!selectedRoute) {
      showError('Please select a route first');
      return;
    }

    const toastId = showLoading('Optimizing route sequence...');
    setIsOptimizing(true);

    try {
      const result = await patrolAI.optimizeRoute(selectedRoute);
      setOptimization(result);
      dismissLoadingAndShowSuccess(toastId, `Route optimized! Saves ${result.timeSaved} minutes`);
    } catch (error) {
      console.error('Route optimization error:', error);
      showError('Failed to optimize route');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleApply = () => {
    if (optimization && onApplyOptimization) {
      onApplyOptimization(optimization.optimizedSequence);
      showSuccess('Route optimization applied!');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center mr-3">
            <i className="fas fa-route text-white"></i>
          </div>
          AI Route Optimization
        </CardTitle>
      </CardHeader>
      <CardContent>
        {selectedRoute && (
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm font-medium text-slate-900">{selectedRoute.name}</p>
            <p className="text-xs text-slate-600">Current duration: {selectedRoute.estimatedDuration}</p>
          </div>
        )}

        <Button
          onClick={handleOptimize}
          disabled={isOptimizing || !selectedRoute}
          className="!bg-[#2563eb] hover:!bg-blue-700 text-white mb-4"
        >
          <i className={`fas ${isOptimizing ? 'fa-spinner fa-spin' : 'fa-magic'} mr-2`}></i>
          {isOptimizing ? 'Optimizing...' : 'Optimize Route'}
        </Button>

        {optimization && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-green-900">Time Saved</span>
                <span className="text-2xl font-bold text-green-700">{optimization.timeSaved} min</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs text-slate-600">Original Duration</p>
                  <p className="text-sm font-medium text-slate-900">{optimization.originalDuration} min</p>
                </div>
                <div>
                  <p className="text-xs text-slate-600">Optimized Duration</p>
                  <p className="text-sm font-medium text-green-700">{optimization.optimizedDuration} min</p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="text-sm font-semibold text-slate-900 mb-2">Optimization Reasoning:</h5>
              <ul className="space-y-2">
                {optimization.reasoning.map((reason: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <i className="fas fa-check-circle text-blue-600 text-xs mt-0.5"></i>
                    <span className="text-sm text-slate-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t">
              <Button
                onClick={handleApply}
                className="!bg-[#2563eb] hover:!bg-blue-700 text-white"
              >
                <i className="fas fa-check mr-2"></i>
                Apply Optimization
              </Button>
              <Button variant="outline" onClick={() => setOptimization(null)}>
                <i className="fas fa-times mr-2"></i>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {!selectedRoute && (
          <div className="text-center py-8 text-slate-600">
            <i className="fas fa-route text-3xl mb-3 text-slate-400"></i>
            <p className="text-sm">Select a route to optimize</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

