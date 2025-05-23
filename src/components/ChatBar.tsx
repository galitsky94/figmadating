import React, { useState, useEffect, useRef } from 'react';

interface ChatMessage {
  id: string;
  senderId: number;
  content: string;
  timestamp: number;
}

interface ChatBarProps {
  activeChat?: {
    userId: number;
    partnerId: number;
    userName: string;
    partnerName: string;
    isUserPremium: boolean;
    isPartnerPremium: boolean;
  };
  onSendMessage: (content: string) => void;
  messages: ChatMessage[];
  onCloseChat: () => void;
}

const ChatBar: React.FC<ChatBarProps> = ({
  activeChat,
  onSendMessage,
  messages,
  onCloseChat
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (activeChat && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [activeChat]);

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    onSendMessage(inputValue);
    setInputValue('');

    setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Auto-scroll to the latest message
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Also scroll when chat is first opened
  useEffect(() => {
    if (activeChat && messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeChat]);

  // Format timestamp to a readable time
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Group consecutive messages from the same sender
  const groupedMessages = () => {
    const groups: Array<{
      senderId: number;
      messages: Array<{id: string; content: string; timestamp: number}>;
      isUser: boolean;
    }> = [];

    let currentGroup: typeof groups[0] | null = null;

    messages.forEach((msg) => {
      const isUser = msg.senderId === activeChat?.userId;

      // Start a new group if this is the first message or sender changed
      if (!currentGroup || currentGroup.senderId !== msg.senderId) {
        if (currentGroup) {
          groups.push(currentGroup);
        }

        currentGroup = {
          senderId: msg.senderId,
          messages: [{ id: msg.id, content: msg.content, timestamp: msg.timestamp }],
          isUser
        };
      } else {
        // Add to current group if same sender
        currentGroup.messages.push({
          id: msg.id,
          content: msg.content,
          timestamp: msg.timestamp
        });
      }
    });

    // Don't forget to add the last group
    if (currentGroup) {
      groups.push(currentGroup);
    }

    return groups;
  };

  if (!activeChat) {
    return null;
  }

  const {
    userName,
    partnerName,
    isUserPremium,
    isPartnerPremium,
  } = activeChat;

  const userColor = isUserPremium ? '#7e22ce' : '#93c5fd'; // Purple for premium, blue for regular
  const partnerColor = isPartnerPremium ? '#7e22ce' : (partnerName.startsWith('You') ? '#93c5fd' : '#ec4899');

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-md bg-black/30 pointer-events-none cursor-none"
    >
      {/* Chat window - limited to 50% width */}
      <div
        className="w-full max-w-xl h-[480px] bg-gray-900/90 border border-gray-800 rounded-lg shadow-xl flex flex-col overflow-hidden pointer-events-auto cursor-default"
      >
        {/* Chat header */}
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800/70 border-b border-gray-700 shrink-0">
          <div className="flex items-center space-x-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: partnerColor }}
            />
            <div className="font-medium text-white">{partnerName}</div>
            {isPartnerPremium && <span className="text-purple-400">⚡</span>}
          </div>

          <div className="flex items-center">
            <div className="text-xs text-gray-400 mr-4">
              Interacting for {Math.floor(messages.length / 2) + 1} minutes
            </div>
            <button
              onClick={onCloseChat}
              className="bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Messages container */}
        <div
          ref={messagesContainerRef}
          className="flex-grow overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-900/95 to-gray-800/95 cursor-default"
        >
          {/* Render message groups */}
          {groupedMessages().map((group, groupIndex) => (
            <div
              key={`group-${groupIndex}`}
              className={`flex flex-col ${group.isUser ? 'items-end' : 'items-start'}`}
            >
              {/* Sender name shown only for first message in group */}
              <div className="px-2 mb-1 text-xs text-gray-400">
                {group.isUser ? 'You' : partnerName}
              </div>

              {/* Message bubbles */}
              <div className="flex flex-col space-y-1 max-w-[80%]">
                {group.messages.map((msg, msgIndex) => (
                  <div
                    key={msg.id}
                    className={`rounded-lg p-2.5 ${
                      group.isUser
                        ? 'rounded-tr-none'
                        : 'rounded-tl-none'
                    }`}
                    style={{
                      backgroundColor: group.isUser ? userColor : partnerColor,
                      opacity: 0.95,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.2)'
                    }}
                  >
                    <p className="text-sm text-white">{msg.content}</p>

                    {/* Only show timestamp on last message in group */}
                    {msgIndex === group.messages.length - 1 && (
                      <div className="text-xs text-gray-200/70 mt-1 text-right">
                        {formatTime(msg.timestamp)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-3 bg-gray-800/80 border-t border-gray-700 shrink-0">
          <form
            className="flex items-center"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              ref={inputRef}
              type="text"
              className="flex-grow bg-gray-700/80 text-white rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-purple-500 cursor-text"
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
            />
            <button
              type="submit"
              className="ml-3 bg-purple-600/90 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatBar;
