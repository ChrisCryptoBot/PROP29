import React, { useEffect, useState } from 'react';
// import logo from '../../assets/Final_logo.png';

const SplashScreen: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-8">
          {/* <img src={logo} alt="PROPER 2.9 Logo" className="h-24 mx-auto mb-4" /> */}
          <div className="h-24 w-24 bg-white rounded-lg mx-auto mb-4 flex items-center justify-center">
            <span className="text-2xl font-bold text-blue-900">P2.9</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold text-white mb-4">
          PROPER 2.9
        </h1>
        <p className="text-xl text-blue-200 mb-8">
          AI-Enhanced Hotel Security Platform
        </p>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
        <p className="text-sm text-blue-300 mt-4">
          Initializing system...
        </p>
      </div>
    </div>
  );
};

export default SplashScreen; 