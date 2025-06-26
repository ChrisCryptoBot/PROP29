import React, { useState } from 'react';
import { FileText, Filter, Search, Download, Calendar } from 'lucide-react';

const EventLog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  const mockEvents = [
    {
      id: 1,
      timestamp: '2024-01-15 10:30:00',
      level: 'INFO',
      message: 'User login successful',
      user: 'john@example.com',
      ip: '192.168.1.100'
    },
    {
      id: 2,
      timestamp: '2024-01-15 10:25:00',
      level: 'WARNING',
      message: 'Failed login attempt',
      user: 'unknown@example.com',
      ip: '192.168.1.101'
    },
    {
      id: 3,
      timestamp: '2024-01-15 10:20:00',
      level: 'ERROR',
      message: 'Database connection failed',
      user: 'system',
      ip: 'localhost'
    },
  ];

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-red-100 text-red-800';
      case 'WARNING': return 'bg-yellow-100 text-yellow-800';
      case 'INFO': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEvents = mockEvents.filter(event => {
    const matchesSearch = event.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = selectedLevel === 'all' || event.level === selectedLevel;
    return matchesSearch && matchesLevel;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold">Event Log</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="ERROR">Error</option>
              <option value="WARNING">Warning</option>
              <option value="INFO">Info</option>
            </select>
          </div>

          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            <Download className="w-4 h-4" />
            Export Log
          </button>
        </div>
      </div>

      {/* Event Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4 border-b">Timestamp</th>
                <th className="text-left p-4 border-b">Level</th>
                <th className="text-left p-4 border-b">Message</th>
                <th className="text-left p-4 border-b">User</th>
                <th className="text-left p-4 border-b">IP Address</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {event.timestamp}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getLevelColor(event.level)}`}>
                      {event.level}
                    </span>
                  </td>
                  <td className="p-4 font-medium">{event.message}</td>
                  <td className="p-4 text-gray-600">{event.user}</td>
                  <td className="p-4 text-gray-600">{event.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No events found matching your criteria
        </div>
      )}
    </div>
  );
};

export default EventLog; 