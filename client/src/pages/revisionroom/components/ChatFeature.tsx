import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Card, CardContent, Button, Input, Avatar, AvatarFallback
} from '@/components/ui';
import { Send, ThumbsUp, MessageCircle, Sparkles, MessageSquare } from 'lucide-react';
import { RevisionRoom, ChatMessage } from '@/types/index3';
import { useRoomContext } from '../shared/RoomContext';
import { getUser } from '@/services/api-backend';

interface ChatFeatureProps {
  room: RevisionRoom;
  colors: any;
  getFacultyColor: (facultyCode?: string) => string;
}

// Interface for grouped messages
interface MessageGroup {
  userId: string;
  userName: string;
  messages: ChatMessage[];
  isCurrentUser: boolean;
  type: string;
}

export const ChatFeature: React.FC<ChatFeatureProps> = ({ 
  room, 
  colors, 
  getFacultyColor 
}) => {
  const { sendMessage, formatChatTime } = useRoomContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [chatMessageInput, setChatMessageInput] = useState<string>('');
  const currentUser = getUser();
  
  // Generate consistent colors for users
  const userColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    const baseColors = [
      '#4E79A7', '#F28E2B', '#59A14F', '#B07AA1', '#76B7B2', 
      '#E15759', '#86BCB6', '#9C755F', '#BAB0AC', '#A0CBE8'
    ];
    
    // Ensure current user always has primary color
    if (currentUser?.userId) {
      colorMap.set(currentUser.userId, colors.primary);
    }
    
    console.log(currentUser)
    console.log(room.chatMessages)
    // Assign colors to other users
    if (room.chatMessages) {
      let colorIndex = 0;
      
      room.chatMessages.forEach(message => {
        if (!colorMap.has(message.userId) && message.userId !== currentUser?.userId) {
          colorMap.set(message.userId, baseColors[colorIndex % baseColors.length]);
          colorIndex++;
        }
      });
    }
    
    return colorMap;
  }, [room.chatMessages, currentUser, colors.primary]);

  // Group messages by user and create clusters
  const messageGroups = useMemo(() => {
    if (!room.chatMessages || room.chatMessages.length === 0) {
      return [];
    }
    
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;
    
    // Time window for grouping messages (5 minutes in milliseconds)
    const timeWindow = 5 * 60 * 1000;
    
    room.chatMessages.forEach((message) => {
      const isCurrentUserMessage = message.userId === currentUser?.userId;
      
      // Special message types are always in their own group
      if (message.type === 'system' || message.type === 'ai') {
        if (currentGroup) {
          groups.push(currentGroup);
          currentGroup = null;
        }
        
        groups.push({
          userId: message.userId,
          userName: message.userName,
          messages: [message],
          isCurrentUser: isCurrentUserMessage,
          type: message.type
        });
        return;
      }
      
      // Check if we should start a new group
      const shouldStartNewGroup = 
        !currentGroup || 
        currentGroup.userId !== message.userId ||
        currentGroup.type !== message.type ||
        (new Date(message.timestamp).getTime() - 
         new Date(currentGroup.messages[currentGroup.messages.length - 1].timestamp).getTime() > timeWindow);
      
      if (shouldStartNewGroup) {
        if (currentGroup) {
          groups.push(currentGroup);
        }
        
        currentGroup = {
          userId: message.userId,
          userName: message.userName,
          messages: [message],
          isCurrentUser: isCurrentUserMessage,
          type: message.type || 'text'
        };
      } else {
        // Add to existing group
        currentGroup.messages.push(message);
      }
    });
    
    // Add the last group if it exists
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    return groups;
  }, [room.chatMessages, currentUser]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current && room.chatMessages) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [room.chatMessages]);

  // Handle send message form submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatMessageInput.trim()) return;
    
    try {
      await sendMessage(chatMessageInput);
      setChatMessageInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // System message component
  const SystemMessageItem = ({ message }: { message: ChatMessage }) => (
    <div className="flex items-center justify-center my-3">
      <div className="px-4 py-2 rounded-full bg-gray-100 text-center text-sm text-gray-600">
        {message.content}
      </div>
    </div>
  );

  // AI message component
  const AIMessageItem = ({ message }: { message: ChatMessage }) => (
    <div className="flex mb-4">
      <div className="flex-shrink-0 mr-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.quaternary }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="max-w-[80%]">
        <div className="flex items-center mb-1">
          <span className="font-bold text-sm mr-2" style={{ color: colors.quaternary }}>AI Tutor</span>
          <span className="text-xs" style={{ color: colors.textMuted }}>{formatChatTime(message.timestamp)}</span>
        </div>
        <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.quaternary}15`, color: colors.textPrimary }}>
          <div className="whitespace-pre-wrap">{message.content}</div>
        </div>
        <div className="flex mt-1 gap-2">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" style={{ color: colors.textMuted }}>
            <ThumbsUp className="w-3 h-3 mr-1" /> Helpful
          </Button>
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" style={{ color: colors.textMuted }}>
            <MessageSquare className="w-3 h-3 mr-1" /> Follow-up
          </Button>
        </div>
      </div>
    </div>
  );

  // Message group component
  const MessageGroupItem = ({ group }: { group: MessageGroup }) => {
    // Handle special message types
    if (group.type === 'system') {
      return <SystemMessageItem message={group.messages[0]} />;
    }
    
    if (group.type === 'ai') {
      return <AIMessageItem message={group.messages[0]} />;
    }
    
    const userColor = group.isCurrentUser 
      ? colors.primary 
      : userColors.get(group.userId) || colors.tertiary;
    
    const isQuestion = group.type === 'question';
    
    return (
      <div className={`flex mb-4 ${group.isCurrentUser ? 'justify-end' : ''}`}>
        {!group.isCurrentUser && (
          <div className="flex-shrink-0 mr-2 self-start mt-1">
            <Avatar className="w-8 h-8">
              <AvatarFallback style={{ backgroundColor: isQuestion ? colors.tertiary : userColor, color: 'white' }}>
                {group.userName.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
        <div className={`max-w-[80%] ${group.isCurrentUser ? 'text-right' : ''}`}>
          <div className="flex items-center mb-1">
            {!group.isCurrentUser && (
              <span className="font-bold text-sm mr-2" style={{ color: isQuestion ? colors.tertiary : userColor }}>
                {group.userName}
              </span>
            )}
            <span className="text-xs" style={{ color: colors.textMuted }}>
              {formatChatTime(group.messages[0].timestamp)}
            </span>
          </div>
          
          <div className="flex flex-col gap-1">
            {group.messages.map((message, index) => {
              // Determine message bubble style based on position within group
              let roundedStyle = 'rounded-lg';
              if (group.messages.length > 1) {
                if (index === 0) {
                  roundedStyle = group.isCurrentUser 
                    ? 'rounded-lg rounded-br-sm' 
                    : 'rounded-lg rounded-bl-sm';
                } else if (index === group.messages.length - 1) {
                  roundedStyle = group.isCurrentUser 
                    ? 'rounded-lg rounded-tr-sm' 
                    : 'rounded-lg rounded-tl-sm';
                } else {
                  roundedStyle = group.isCurrentUser 
                    ? 'rounded-lg rounded-r-sm' 
                    : 'rounded-lg rounded-l-sm';
                }
              }
              
              return (
                <div 
                  key={message.id}
                  className={`p-3 ${roundedStyle} ${group.isCurrentUser ? 'ml-auto' : ''}`} 
                  style={{ 
                    backgroundColor: group.isCurrentUser 
                      ? userColor
                      : isQuestion
                        ? `${colors.tertiary}15`
                        : colors.surface, 
                    color: group.isCurrentUser ? 'white' : colors.textPrimary,
                    border: !group.isCurrentUser && !isQuestion ? `1px solid ${colors.border}` : 'none',
                    maxWidth: '100%'
                  }}
                >
                  <div className="text-left">{message.content}</div>
                </div>
              );
            })}
          </div>
          
          {!group.isCurrentUser && (
            <div className="flex mt-1 gap-2">
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" style={{ color: colors.textMuted }}>
                <ThumbsUp className="w-3 h-3 mr-1" /> {group.messages[0].likes || 0}
              </Button>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" style={{ color: colors.textMuted }}>
                <MessageCircle className="w-3 h-3 mr-1" /> Reply
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6 space-y-4">
      <Card style={{ backgroundColor: colors.surface }}>
        <CardContent className="p-4">
          <div className="flex flex-col h-[400px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-2" ref={chatContainerRef}>
              {messageGroups.length > 0 ? (
                messageGroups.map((group, index) => (
                  <MessageGroupItem key={`group-${index}`} group={group} />
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-center">
                  <div>
                    <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm" style={{ color: colors.textSecondary }}>No messages yet. Start a conversation!</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Chat Input */}
            <div className="pt-4 border-t" style={{ borderColor: colors.border }}>
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Type your message..."
                  value={chatMessageInput}
                  onChange={(e) => setChatMessageInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="submit"
                  style={{ backgroundColor: getFacultyColor(room.facultyCode), color: 'white' }}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
              <div className="flex justify-between mt-2">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" style={{ color: colors.textSecondary }}>
                    Add File
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" style={{ color: colors.textSecondary }}>
                    Format
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 px-2 text-xs" 
                    style={{ color: colors.quaternary }}
                  >
                    <Sparkles className="w-3 h-3 mr-1" /> Ask AI
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" style={{ color: colors.textSecondary }}>
                  Turn on notifications
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};