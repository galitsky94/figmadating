import React, { useEffect, useState } from 'react';

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

interface MessageProps {
  message: string;
  sender: User;
  x: number;
  y: number;
  timestamp: number;
}

const Message: React.FC<MessageProps> = ({ message, sender, x, y, timestamp }) => {
  const [visible, setVisible] = useState(true);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Message disappears after 5 seconds
    const timeout = setTimeout(() => {
      // Start fading out
      setOpacity(0);

      // Then hide completely
      setTimeout(() => {
        setVisible(false);
      }, 1000);
    }, 4000);

    return () => clearTimeout(timeout);
  }, [timestamp]);

  if (!visible) return null;

  // Get the text color based on sender's gender/status
  const getColor = () => {
    if (sender.isPremium) return '#9333ea'; // Purple for premium
    if (sender.gender === 'female') return '#ec4899'; // Pink for female
    return '#93c5fd'; // Light blue for male
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -50%)',
        maxWidth: '200px',
        opacity,
        transition: 'opacity 1s',
        zIndex: 50,
      }}
      className="bg-black bg-opacity-70 rounded-lg px-3 py-2 text-white text-sm shadow-lg border"
    >
      <div className="flex items-center gap-1 mb-1">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: getColor() }}
        />
        <span className="font-bold" style={{ color: getColor() }}>
          {sender.name}
        </span>
      </div>
      <p>{message}</p>
      <div
        className="absolute w-0 h-0 bottom-[-8px] left-1/2 transform -translate-x-1/2"
        style={{
          borderLeft: '8px solid transparent',
          borderRight: '8px solid transparent',
          borderTop: '8px solid rgba(0,0,0,0.7)',
        }}
      />
    </div>
  );
};

export default Message;
