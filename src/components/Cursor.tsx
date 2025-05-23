import React from 'react';

interface User {
  id: number;
  name: string;
  username: string;
  gender: 'female' | 'male';
  isPremium: boolean;
  x: number;
  y: number;
  speedX: number;
  speedY: number;
  isInteracting?: boolean;
}

interface CursorProps {
  user: User;
  isInteracting?: boolean;
}

const Cursor: React.FC<CursorProps> = ({ user, isInteracting }) => {
  // Get the cursor color based on user properties
  const getCursorColor = () => {
    if (user.isPremium) return '#9333ea'; // Purple for premium
    if (user.gender === 'female') return '#ec4899'; // Pink for female
    return '#93c5fd'; // Light blue for male
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${user.x}px`,
        top: `${user.y}px`,
        zIndex: user.isPremium ? 10 : 1, // Premium users appear on top
        transition: 'left 0.05s linear, top 0.05s linear',
      }}
      className="select-none"
    >
      {/* Standard system cursor arrow */}
      <div className="relative">
        {/* This is the standard cursor arrow SVG */}
        <svg
          width="24"
          height="24"
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{
            filter: 'drop-shadow(0px 1px 1px rgba(0,0,0,0.3))'
          }}
        >
          <path
            d="M8.5,4.5 L8.5,22.5 L13.5,17.5 L17.5,26.5 L21.5,24.5 L17.5,15.5 L23.5,15.5 L8.5,4.5 Z"
            fill={getCursorColor()}
            stroke="white"
            strokeWidth="1"
          />
        </svg>

        {/* Name tag */}
        <div
          className={`absolute top-[28px] left-[0px] rounded-md px-3 py-1.5 text-sm font-medium text-white shadow-lg min-w-[120px] flex items-center ${isInteracting ? 'animate-pulse' : ''}`}
          style={{
            backgroundColor: getCursorColor(),
            whiteSpace: 'nowrap',
            opacity: isInteracting ? 0.9 : 0.8,
            transform: isInteracting ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.2s, opacity 0.2s'
          }}
        >
          <span className="mr-1">{user.name}</span>
          <span className="opacity-80">@{user.username}</span>
          {user.isPremium && (
            <span className="ml-1">⚡</span>
          )}
          <span className="ml-auto cursor-pointer">•••</span>
        </div>
      </div>
    </div>
  );
};

export default Cursor;
