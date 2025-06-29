import React from 'react';

interface PCLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const PCLogo: React.FC<PCLogoProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {/* PC Case */}
        <rect
          x="6"
          y="8"
          width="20"
          height="28"
          rx="2"
          className="fill-gray-700"
        />
        
        {/* Front Panel */}
        <rect
          x="8"
          y="10"
          width="16"
          height="24"
          rx="1"
          className="fill-gray-800"
        />
        
        {/* Power Button */}
        <circle
          cx="16"
          cy="14"
          r="1.5"
          className="fill-blue-500"
        />
        
        {/* Drive Bays */}
        <rect
          x="10"
          y="17"
          width="12"
          height="1"
          className="fill-gray-600"
        />
        <rect
          x="10"
          y="19"
          width="12"
          height="1"
          className="fill-gray-600"
        />
        
        {/* Ventilation Grilles */}
        <rect
          x="10"
          y="25"
          width="2"
          height="6"
          rx="0.5"
          className="fill-gray-600"
        />
        <rect
          x="13"
          y="25"
          width="2"
          height="6"
          rx="0.5"
          className="fill-gray-600"
        />
        <rect
          x="16"
          y="25"
          width="2"
          height="6"
          rx="0.5"
          className="fill-gray-600"
        />
        <rect
          x="19"
          y="25"
          width="2"
          height="6"
          rx="0.5"
          className="fill-gray-600"
        />
        
        {/* Monitor */}
        <rect
          x="28"
          y="10"
          width="10"
          height="8"
          rx="1"
          className="fill-gray-700"
        />
        
        {/* Monitor Screen */}
        <rect
          x="29"
          y="11"
          width="8"
          height="6"
          rx="0.5"
          className="fill-blue-500"
        />
        
        {/* Monitor Stand */}
        <rect
          x="32"
          y="18"
          width="2"
          height="3"
          className="fill-gray-700"
        />
        <rect
          x="30"
          y="21"
          width="6"
          height="1"
          rx="0.5"
          className="fill-gray-700"
        />
        
        {/* Gaming Elements - Controller Icon */}
        <circle
          cx="4"
          cy="20"
          r="2"
          className="fill-purple-500 opacity-80"
        />
        <rect
          x="2"
          y="19"
          width="4"
          height="2"
          rx="1"
          className="fill-purple-600"
        />
        
        {/* Gaming Elements - Small squares representing pixels/gaming */}
        <rect
          x="2"
          y="26"
          width="1"
          height="1"
          className="fill-blue-400"
        />
        <rect
          x="2"
          y="28"
          width="1"
          height="1"
          className="fill-purple-400"
        />
        <rect
          x="2"
          y="30"
          width="1"
          height="1"
          className="fill-blue-400"
        />
      </svg>
    </div>
  );
};

export default PCLogo;