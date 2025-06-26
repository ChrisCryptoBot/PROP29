import React from 'react';

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            PROPER 2.9
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            AI-Enhanced Hotel Security Platform
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <p className="text-gray-500">
              Login functionality will be implemented here.
            </p>
            <p className="text-sm text-gray-400 mt-2">
              Default credentials: admin@proper29.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 