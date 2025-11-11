import React from 'react';
import { useNavigate } from 'react-router-dom';

const BackToDashboardButton: React.FC<{ label?: string }> = ({ label = 'Back to Dashboard' }) => {
  const navigate = useNavigate();
  return (
    <button
      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 text-base font-medium focus:outline-none hover:bg-blue-50 transition-colors shadow-sm"
      onClick={() => navigate('/dashboard')}
    >
      <i className="fas fa-arrow-left text-blue-600"></i>
      {label}
    </button>
  );
};

export default BackToDashboardButton; 