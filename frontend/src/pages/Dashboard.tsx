import React from 'react';
import Layout from '../components/Layout/Layout';

const Dashboard: React.FC = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">
            Dashboard
          </h1>
          <p className="text-slate-600">
            Welcome to the Proper 2.9 Security Management System. Use the sidebar to access all modules.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;