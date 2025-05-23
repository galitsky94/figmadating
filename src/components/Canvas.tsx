import { useEffect, useState, useRef } from 'react';
import Cursor from './Cursor';
import { generateUsers } from '../utils/userGenerator';
import ChatBar from './ChatBar';

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
  isRealUser?: boolean;
}

interface ChatMessage {
  id: string;
  senderId: number;
  content: string;
  timestamp: number;
}

// Sample of message responses for simulated users
const AI_RESPONSES = [
  "Hi there! Nice to meet you on the canvas.",
  "What brings you here today?",
  "I love the way you move your cursor!",
  "Have you been here before?",
  "I'm new to this dating canvas. It's interesting!",
  "Do you come here often?",
  "Your cursor has a nice color!",
  "Have you met many interesting people here?",
  "What do you like to do when you're not cursor dating?",
  "I'm enjoying our interaction!",
  "You seem nice. Do you want to chat more?",
  "How's your day going?",
  "The cursor dance is fun, isn't it?",
  "I like how our cursors connect.",
];

// Calculate distance between two points
const getDistance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

// Add a ChatStatus type
type ChatStatus = 'none' | 'started' | 'active';

const Canvas = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [interactions, setInteractions] = useState<Record<number, number>>({});
  const [userCursor, setUserCursor] = useState<User | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const interactionStartTimeRef = useRef<Record<string, number>>({});
  const mousePositionRef = useRef({ x: 0, y: 0 });
  const initialized = useRef(false);
  const [isInChatMode, setIsInChatMode] = useState(false);
  // Add chatStatus to track chat state more precisely
  const [chatStatus, setChatStatus] = useState<ChatStatus>('none');
  const [activeChat, setActiveChat] = useState<{
    userId: number;
    partnerId: number;
    userName: string;
    partnerName: string;
    isUserPremium: boolean;
    isPartnerPremium: boolean;
  } | undefined>(undefined);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatResponseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to close the chat window
  const handleCloseChat = () => {
    setActiveChat(undefined);
    setChatStatus('none');
    setChatMessages([]);
    // Clear any active AI response timeout
    if (chatResponseTimeoutRef.current) {
      clearTimeout(chatResponseTimeoutRef.current);
      chatResponseTimeoutRef.current = null;
    }
  };

  // Initialize all cursors at once
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Generate simulated users first
    const generatedUsers = generateUsers();

    // Create real user cursor
    const realUserCursor: User = {
      id: 999, // Special ID for real user
      name: 'You',
      username: 'user',
      gender: 'male', // Default, but doesn't matter functionally
      isPremium: true, // Make the user premium
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      speedX: 0,
      speedY: 0,
      isRealUser: true
    };

    // Set user cursor state
    setUserCursor(realUserCursor);

    // Initialize all users at once to prevent disappearing
    setUsers([...generatedUsers, realUserCursor]);
  }, []);

  // Track mouse movement
  useEffect(() => {
    if (!userCursor) return;

    const handleMouseMove = (e: MouseEvent) => {
      // Update the mouse position reference
      mousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [userCursor]);

  // Update chat mode and chatStatus when activeChat changes
  useEffect(() => {
    setIsInChatMode(!!activeChat);
    if (activeChat) {
      setChatStatus('started');
    } else {
      setChatStatus('none');
    }
  }, [activeChat]);

  // Handle sending a new message
  const handleSendMessage = (content: string) => {
    if (!activeChat) return;

    // Set chat status to active once user sends a message
    setChatStatus('active');

    // Create a new message from the user
    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random()}`,
      senderId: activeChat.userId,
      content,
      timestamp: Date.now(),
    };

    // Add the message to the chat
    setChatMessages(prev => [...prev, newMessage]);

    // Clear any existing timeout
    if (chatResponseTimeoutRef.current) {
      clearTimeout(chatResponseTimeoutRef.current);
    }

    // Set a timeout for the AI response (1-3 seconds)
    const responseDelay = 1000 + Math.random() * 2000;
    chatResponseTimeoutRef.current = setTimeout(() => {
      // Create the AI response
      const aiResponse: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random()}`,
        senderId: activeChat.partnerId,
        content: AI_RESPONSES[Math.floor(Math.random() * AI_RESPONSES.length)],
        timestamp: Date.now(),
      };

      // Add the AI response to the chat
      setChatMessages(prev => [...prev, aiResponse]);
    }, responseDelay);
  };

  // Animation loop
  useEffect(() => {
    if (users.length === 0) return;

    const interval = setInterval(() => {
      setUsers(prevUsers => {
        // Create a copy to avoid direct state mutation
        const updatedUsers = [...prevUsers];

        // Update real user cursor position from mouse position reference
        const userIndex = updatedUsers.findIndex(u => u.isRealUser);
        if (userIndex >= 0) {
          updatedUsers[userIndex] = {
            ...updatedUsers[userIndex],
            x: mousePositionRef.current.x,
            y: mousePositionRef.current.y
          };
        }

        // Check for interactions
        const newInteractions: Record<number, number> = {};
        const interactionDistance = 80; // Distance for interaction
        const now = Date.now();

        // Check each pair of users for possible interactions
        for (let i = 0; i < updatedUsers.length; i++) {
          for (let j = i + 1; j < updatedUsers.length; j++) {
            // Skip interaction checks for the real user in specific scenarios:
            // 1. If the real user is in chat mode, only allow interaction with current chat partner
            // 2. If no chat is active, allow normal interactions
            const isUserInPair = updatedUsers[i].isRealUser || updatedUsers[j].isRealUser;

            if (isUserInPair) {
              // Get references to the real user and the other cursor
              const realUserCursor = updatedUsers[i].isRealUser ? updatedUsers[i] : updatedUsers[j];
              const otherCursor = updatedUsers[i].isRealUser ? updatedUsers[j] : updatedUsers[i];

              // If chat is active, only allow interaction with current chat partner
              if (activeChat) {
                // Skip if this isn't the current chat partner
                if (otherCursor.id !== activeChat.partnerId) {
                  continue;
                }
              }
            }

            const distance = getDistance(
              updatedUsers[i].x,
              updatedUsers[i].y,
              updatedUsers[j].x,
              updatedUsers[j].y
            );

            // If they're close enough, create an interaction
            if (distance < interactionDistance) {
              // Regular male-female interaction
              const regularInteraction = (
                (updatedUsers[i].gender === 'male' && updatedUsers[j].gender === 'female') ||
                (updatedUsers[i].gender === 'female' && updatedUsers[j].gender === 'male')
              );

              // Special condition for real user - can interact with any cursor (when not in chat)
              const userInteraction = (
                (updatedUsers[i].isRealUser || updatedUsers[j].isRealUser) &&
                !isInChatMode && chatStatus === 'none'
              );

              if (regularInteraction || userInteraction) {
                // If user already has an interaction and this is a new cursor, skip it
                if ((updatedUsers[i].isRealUser && interactions[updatedUsers[i].id] &&
                     interactions[updatedUsers[i].id] !== updatedUsers[j].id) ||
                    (updatedUsers[j].isRealUser && interactions[updatedUsers[j].id] &&
                     interactions[updatedUsers[j].id] !== updatedUsers[i].id)) {
                  continue;
                }

                newInteractions[updatedUsers[i].id] = updatedUsers[j].id;
                newInteractions[updatedUsers[j].id] = updatedUsers[i].id;

                // Track interaction start time
                const interactionKey = [updatedUsers[i].id, updatedUsers[j].id].sort().join('-');
                if (!interactionStartTimeRef.current[interactionKey]) {
                  interactionStartTimeRef.current[interactionKey] = now;
                }

                // Check if this interaction has lasted for 3+ seconds and involves the real user
                const interactionDuration = now - interactionStartTimeRef.current[interactionKey];
                const isUserInvolved = updatedUsers[i].isRealUser || updatedUsers[j].isRealUser;

                if (interactionDuration > 3000 && isUserInvolved) {
                  // Determine which user is the real user
                  const realUser = updatedUsers[i].isRealUser ? updatedUsers[i] : updatedUsers[j];
                  const partner = updatedUsers[i].isRealUser ? updatedUsers[j] : updatedUsers[i];

                  // Set or update the active chat
                  if (!activeChat || activeChat.partnerId !== partner.id) {
                    setActiveChat({
                      userId: realUser.id,
                      partnerId: partner.id,
                      userName: realUser.name,
                      partnerName: partner.name,
                      isUserPremium: realUser.isPremium,
                      isPartnerPremium: partner.isPremium,
                    });

                    // Reset messages for the new chat
                    if (activeChat?.partnerId !== partner.id) {
                      setChatMessages([]);

                      // Add an initial greeting message from the partner
                      const initialMessage: ChatMessage = {
                        id: `msg-${Date.now()}-${Math.random()}`,
                        senderId: partner.id,
                        content: `Hi there! I'm ${partner.name}. Nice to meet you!`,
                        timestamp: Date.now(),
                      };

                      setChatMessages([initialMessage]);
                    }
                  }
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

        // Update interactions state (outside the loop to reduce renders)
        setInteractions(newInteractions);

        // Update positions for simulated cursors only
        return updatedUsers.map(user => {
          // Skip updates for the real user cursor (handled separately above)
          if (user.isRealUser) {
            return {
              ...user,
              isInteracting: !!newInteractions[user.id],
              interactingWith: newInteractions[user.id]
            };
          }

          // Calculate new position for simulated cursor
          let newX = user.x;
          let newY = user.y;

          if (newInteractions[user.id]) {
            // Check if interacting with the real user
            const partnerId = newInteractions[user.id];
            const partnerUser = updatedUsers.find(u => u.id === partnerId);
            const isUserInteraction = partnerUser?.isRealUser;

            if (isUserInteraction) {
              // When interacting with real user, use a gentle approach
              // Calculate vector toward user cursor
              const targetUser = updatedUsers.find(u => u.id === partnerId && u.isRealUser);
              if (targetUser) {
                const dx = targetUser.x - user.x;
                const dy = targetUser.y - user.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                // Keep some distance from the user (don't get too close)
                if (distance > 40) {
                  const factor = 0.02; // Very gentle movement
                  newX = user.x + dx * factor;
                  newY = user.y + dy * factor;
                }
              }
            } else {
              // Regular interaction with another simulated cursor
              newX = user.x + user.speedX * 0.3;
              newY = user.y + user.speedY * 0.3;
            }
          } else {
            // Normal movement when not interacting
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
    }, 40);

    return () => {
      clearInterval(interval);
      if (chatResponseTimeoutRef.current) {
        clearTimeout(chatResponseTimeoutRef.current);
      }
    };
  }, [users.length, activeChat, isInChatMode, chatStatus, chatMessages.length]);

  // We don't need to adjust canvas height anymore since chat is a modal window overlay
  const canvasStyle = {
    height: '100vh',
    transition: 'height 0.3s ease-in-out'
  };

  return (
    <>
      <div
        ref={canvasRef}
        className="relative w-full bg-black cursor-none overflow-hidden"
        style={canvasStyle}
      >
        {/* Render interaction lines */}
        <svg className="absolute h-full w-full pointer-events-none">
          {Object.entries(interactions).map(([userId1, userId2]) => {
            const user1 = users.find(u => u.id === parseInt(userId1));
            const user2 = users.find(u => u.id === parseInt(userId2));

            if (!user1 || !user2 || parseInt(userId1) > userId2) return null;

            const isPremiumInteraction = user1.isPremium || user2.isPremium;
            const isUserInteraction = user1.isRealUser || user2.isRealUser;

            // Calculate interaction duration
            const interactionKey = [parseInt(userId1), parseInt(userId2)].sort().join('-');
            const interactionStart = interactionStartTimeRef.current[interactionKey] || Date.now();
            const interactionDuration = Date.now() - interactionStart;

            // Line properties based on interaction duration
            let strokeWidth = isPremiumInteraction ? 2 : 1;
            let opacity = 0.7;
            let strokeDash = "4";

            // Make user interactions more prominent
            if (isUserInteraction) {
              strokeWidth += 0.5;
              opacity = 0.8;
            }

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

        {/* Render all simulated cursors */}
        {users.filter(user => !user.isRealUser).map(user => (
          <Cursor
            key={user.id}
            user={user}
            isInteracting={!!interactions[user.id]}
          />
        ))}

        {/* Render real user cursor separately */}
        {users.find(user => user.isRealUser) && (
          <div
            className="absolute pointer-events-none z-50"
            style={{
              left: `${mousePositionRef.current.x}px`,
              top: `${mousePositionRef.current.y}px`,
              transform: 'translate(-50%, -50%)',
              zIndex: 1000, // Ensure cursor is above everything else
            }}
          >
            <div className="relative">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8.5,4.5 L8.5,22.5 L13.5,17.5 L17.5,26.5 L21.5,24.5 L17.5,15.5 L23.5,15.5 L8.5,4.5 Z"
                  fill={isInChatMode || chatStatus !== 'none' ? "#ff7bbd" : "#7e22ce"} // Change cursor color when in chat
                  stroke="white"
                  strokeWidth="1.5"
                />
              </svg>

              {/* Name tag for user cursor */}
              <div
                className={`absolute top-[28px] left-[0px] rounded-md px-3 py-1.5 font-medium text-white shadow-lg min-w-[100px] flex items-center ${interactions[999] ? 'animate-pulse' : ''}`}
                style={{
                  backgroundColor: isInChatMode || chatStatus !== 'none' ? '#ff7bbd' : '#7e22ce', // Change color when in chat
                  whiteSpace: 'nowrap',
                }}
              >
                <span className="mr-1">You</span>
                <span className="opacity-80">@user</span>
                <span className="ml-1">⚡</span>
                {(isInChatMode || chatStatus !== 'none') && <span className="ml-1">💬</span>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Chat bar component */}
      <ChatBar
        activeChat={activeChat}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
        onCloseChat={handleCloseChat}
      />
    </>
  );
};

export default Canvas;
