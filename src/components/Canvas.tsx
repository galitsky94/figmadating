import { useEffect, useState, useRef } from 'react';
import Cursor from './Cursor';
import { generateUsers } from '../utils/userGenerator';

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
  interactingWith?: number;
}

// Calculate distance between two points
const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

const Canvas = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [interactions, setInteractions] = useState<Record<number, number>>({});
  const canvasRef = useRef<HTMLDivElement>(null);
  const interactionStartTimeRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Generate 11 users: 7 females, 3 males, 1 premium male
    const generatedUsers = generateUsers();
    setUsers(generatedUsers);

    const interval = setInterval(() => {
      setUsers(prevUsers => {
        // Check for interactions
        const newInteractions: Record<number, number> = {};
        const interactionDistance = 80; // Distance for interaction
        const now = Date.now();

        // Check each pair of users for possible interactions
        for (let i = 0; i < prevUsers.length; i++) {
          for (let j = i + 1; j < prevUsers.length; j++) {
            const distance = getDistance(
              prevUsers[i].x,
              prevUsers[i].y,
              prevUsers[j].x,
              prevUsers[j].y
            );

            // If they're close enough, create an interaction
            if (distance < interactionDistance) {
              if (
                // Male-female interaction
                (prevUsers[i].gender === 'male' && prevUsers[j].gender === 'female') ||
                (prevUsers[i].gender === 'female' && prevUsers[j].gender === 'male')
              ) {
                newInteractions[prevUsers[i].id] = prevUsers[j].id;
                newInteractions[prevUsers[j].id] = prevUsers[i].id;

                // Track interaction start time
                const interactionKey = [prevUsers[i].id, prevUsers[j].id].sort().join('-');
                if (!interactionStartTimeRef.current[interactionKey]) {
                  interactionStartTimeRef.current[interactionKey] = now;
                }
              }
            }
          }
        }

        // Clean up interaction times for pairs no longer interacting
        Object.keys(interactionStartTimeRef.current).forEach(key => {
          const [id1, id2] = key.split('-').map(Number);
          if (!newInteractions[id1] || !newInteractions[id2]) {
            delete interactionStartTimeRef.current[key];
          }
        });

        setInteractions(newInteractions);

        // Update positions
        return prevUsers.map(user => {
          // Calculate new position
          let newX = user.x;
          let newY = user.y;

          if (newInteractions[user.id]) {
            // If interacting, move at reduced speed
            newX = user.x + user.speedX * 0.3;
            newY = user.y + user.speedY * 0.3;
          } else {
            // If not interacting, move at full speed
            newX = user.x + user.speedX;
            newY = user.y + user.speedY;
          }

          // Check boundaries and bounce
          const canvasWidth = canvasRef.current?.clientWidth || window.innerWidth;
          const canvasHeight = canvasRef.current?.clientHeight || window.innerHeight;

          // Apply boundary checks
          if (newX <= 0 || newX >= canvasWidth - 30) {
            user.speedX = -user.speedX;
            newX = Math.max(0, Math.min(newX, canvasWidth - 30));
          }

          if (newY <= 0 || newY >= canvasHeight - 60) {
            user.speedY = -user.speedY;
            newY = Math.max(0, Math.min(newY, canvasHeight - 60));
          }

          return {
            ...user,
            x: newX,
            y: newY,
            isInteracting: !!newInteractions[user.id],
            interactingWith: newInteractions[user.id]
          };
        });
      });
    }, 30); // Faster update rate (30ms instead of 50ms) for smoother animation

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      ref={canvasRef}
      className="relative h-full w-full bg-black"
    >
      {/* Render interaction lines */}
      <svg className="absolute h-full w-full pointer-events-none">
        {Object.entries(interactions).map(([userId1, userId2]) => {
          const user1 = users.find(u => u.id === parseInt(userId1));
          const user2 = users.find(u => u.id === parseInt(userId2));

          if (!user1 || !user2 || parseInt(userId1) > userId2) return null;

          const isPremiumInteraction = user1.isPremium || user2.isPremium;

          // Calculate interaction duration
          const interactionKey = [parseInt(userId1), parseInt(userId2)].sort().join('-');
          const interactionStart = interactionStartTimeRef.current[interactionKey] || Date.now();
          const interactionDuration = Date.now() - interactionStart;

          // Line properties based on interaction duration
          let strokeWidth = isPremiumInteraction ? 2 : 1;
          let opacity = 0.7;
          let strokeDash = "4";

          // Enhance line as interaction continues (without using explicit timer)
          if (interactionDuration > 1000) {
            strokeWidth += 0.5;
            opacity = 0.8;
            strokeDash = "3,2";
          }

          if (interactionDuration > 2000) {
            strokeWidth += 0.5;
            opacity = 0.9;
            strokeDash = "2,1";
          }

          // At 3+ seconds, the line is most prominent
          if (interactionDuration > 3000) {
            strokeWidth += 1;
            opacity = 1;
            strokeDash = isPremiumInteraction ? "0" : "1";
          }

          return (
            <line
              key={`${userId1}-${userId2}`}
              x1={user1.x + 10}
              y1={user1.y + 10}
              x2={user2.x + 10}
              y2={user2.y + 10}
              stroke={isPremiumInteraction ? "#9333ea" : "#ec4899"}
              strokeWidth={strokeWidth}
              strokeDasharray={strokeDash}
              opacity={opacity}
            />
          );
        })}
      </svg>

      {/* Render users */}
      {users.map(user => (
        <Cursor
          key={user.id}
          user={user}
          isInteracting={!!interactions[user.id]}
        />
      ))}
    </div>
  );
};

export default Canvas;
