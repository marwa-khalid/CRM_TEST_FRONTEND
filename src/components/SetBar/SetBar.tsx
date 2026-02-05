import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';



const Setting: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Dynamically determine the active tab from the URL
  const Tab = location.pathname.includes('/system') ? 'crm' : 'profile';

  return (
    <div className="inline-flex border border-gray-300 rounded-md overflow-hidden mb-14">
       <button
        onClick={() => navigate('/settings/profile')}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          Tab === 'profile'
            ? 'bg-white text-gray-900 font-semibold'
            : 'bg-gray-50 text-gray-600 hover:text-gray-900'
        }`}
      >
        My Profile Settings
      </button>
      <button
        onClick={() => navigate('/settings/system')}
        className={`px-4 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
          Tab === 'crm'
            ? 'bg-white text-gray-900 font-semibold'
            : 'bg-gray-50 text-gray-600 hover:text-gray-900'
        }`}
      >
        CRM Configurations
      </button>
    </div>
  );
};

export default Setting;
