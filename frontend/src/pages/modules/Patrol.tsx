import React, { useState } from 'react';
import { MapPin, Clock, User, CheckCircle, AlertCircle, Play, Pause, Square } from 'lucide-react';

const Patrol: React.FC = () => {
  const [activePatrols, setActivePatrols] = useState([
    {
      id: 1,
      guard: 'John Smith',
      route: 'Building A - Ground Floor',
      status: 'active',
      startTime: '09:00',
      checkpoints: 5,
      completed: 2
    },
    {
      id: 2,
      guard: 'Jane Doe',
      route: 'Building B - Upper Floors',
      status: 'paused',
      startTime: '08:30',
      checkpoints: 8,
      completed: 6
    }
  ]);

  const [scheduledPatrols] = useState([
    {
      id: 3,
      guard: 'Mike Johnson',
      route: 'Perimeter - Night Shift',
      scheduledTime: '22:00',
      duration: '2 hours'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'paused': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Patrol Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Patrols */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Active Patrols</h2>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              New Patrol
            </button>
          </div>

          <div className="space-y-4">
            {activePatrols.map((patrol) => (
              <div key={patrol.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{patrol.guard}</span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(patrol.status)}`}>
                    {patrol.status}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {patrol.route}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    Started: {patrol.startTime}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4" />
                    Progress: {patrol.completed}/{patrol.checkpoints} checkpoints
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(patrol.completed / patrol.checkpoints) * 100}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200">
                    <Play className="w-3 h-3" />
                    Resume
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200">
                    <Pause className="w-3 h-3" />
                    Pause
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200">
                    <Square className="w-3 h-3" />
                    End
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scheduled Patrols */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">Scheduled Patrols</h2>
          
          <div className="space-y-4">
            {scheduledPatrols.map((patrol) => (
              <div key={patrol.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">{patrol.guard}</span>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Scheduled
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {patrol.route}
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    {patrol.scheduledTime} ({patrol.duration})
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex items-center gap-1 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                    <Play className="w-3 h-3" />
                    Start Now
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <button className="flex items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <MapPin className="w-5 h-5 text-blue-600" />
            <span>Create Route</span>
          </button>
          <button className="flex items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <Clock className="w-5 h-5 text-green-600" />
            <span>Schedule Patrol</span>
          </button>
          <button className="flex items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <User className="w-5 h-5 text-purple-600" />
            <span>Assign Guard</span>
          </button>
          <button className="flex items-center gap-2 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <span>Report Issue</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Patrol; 