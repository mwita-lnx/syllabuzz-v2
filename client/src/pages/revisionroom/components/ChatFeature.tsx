import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Card, CardContent, Button, Input, Avatar, AvatarFallback,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger
} from '@/components/ui';
import { Send, ThumbsUp, MessageCircle, Sparkles, MessageSquare, X, CornerDownRight } from 'lucide-react';
import { RevisionRoom, ChatMessage } from '@/types/index3';
import { useRoomContext } from '../shared/RoomContext';
import { getUser } from '@/services/api-backend';

interface ChatFeatureProps {
  room: RevisionRoom;
  colors: any;
  getFacultyColor: (facultyCode?: string) => string;
}

// Enhanced ChatMessage with parentId support
interface EnhancedChatMessage extends ChatMessage {
  parentId?: string;
  parentMessage?: ChatMessage;
}

// Interface for grouped messages
interface MessageGroup {
  userId: string;
  userName: string;
  messages: EnhancedChatMessage[];
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
  const [replyToMessage, setReplyToMessage] = useState<EnhancedChatMessage | null>(null);
  const currentUser = getUser();
  
  // Sort messages chronologically (oldest first)
  const sortedMessages = useMemo(() => {
    if (!room.chatMessages) return [];
    
    return [...room.chatMessages].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateA - dateB;
    });
  }, [room.chatMessages]);
  
  // Process messages to find parent messages for replies
  const processedMessages = useMemo(() => {
    const messagesMap = new Map<string, EnhancedChatMessage>();
    
    // First, create a map of all messages by ID
    sortedMessages.forEach(message => {
      console.log('Processing message:', message);
      // Handle inconsistency between user_id and userId in the data
      const messageUserId = message.user_id || message.userId;
      const currentUserId = currentUser?.userId || currentUser?.user_id;
      const messageUserName = message.userName || message.user_name;
      
      // Make sure we consistently identify the current user's messages
      const isCurrentUserMessage = messageUserId === currentUserId;
      
      messagesMap.set(message.id, {
        ...message,
        // Normalize userId/user_id to ensure consistency
        userId: messageUserId,
        user_id: messageUserId,
        userName: messageUserName,
        parentId: undefined,
        parentMessage: undefined,
        // Force isCurrentUser to be recalculated consistently
        isCurrentUser: isCurrentUserMessage
      });
    });
    
    // Then, process messages to find parent-child relationships
    // For this demo, we'll simulate some parent-child relationships
    // In a real implementation, you would use actual parentId fields from your data
    
    // Simulate replies for demonstration
    // Every 5th message is a reply to the previous message
    sortedMessages.forEach((message, index) => {
      if (index % 5 === 0 && index > 0) {
        const previousMessage = sortedMessages[index - 1];
        const enhancedMessage = messagesMap.get(message.id);
        if (enhancedMessage && previousMessage) {
          enhancedMessage.parentId = previousMessage.id;
          enhancedMessage.parentMessage = previousMessage as EnhancedChatMessage;
        }
      }
    });
    
    return Array.from(messagesMap.values());
  }, [sortedMessages, currentUser]);
  
  // Generate consistent colors for users
  const userColors = useMemo(() => {
    const colorMap = new Map<string, string>();
    const baseColors = [
      '#4E79A7', '#F28E2B', '#59A14F', '#B07AA1', '#76B7B2', 
      '#E15759', '#86BCB6', '#9C755F', '#BAB0AC', '#A0CBE8'
    ];
    
    // Ensure current user has a distinct color
    if (currentUser) {
      const currentUserId = currentUser.userId || currentUser.user_id;
      if (currentUserId) {
        colorMap.set(currentUserId, colors.primary);
      }
    }
    
    // Assign colors to other users
    if (processedMessages) {
      let colorIndex = 0;
      
      processedMessages.forEach(message => {
        const msgUserId = message.user_id || message.userId;
        const curUserId = currentUser?.userId || currentUser?.user_id;
        
        if (msgUserId && !colorMap.has(msgUserId) && msgUserId !== curUserId) {
          colorMap.set(msgUserId, baseColors[colorIndex % baseColors.length]);
          colorIndex++;
        }
      });
    }
    
    return colorMap;
  }, [processedMessages, currentUser, colors.primary]);

  // Group messages by user and create clusters
  const messageGroups = useMemo(() => {
    if (!processedMessages || processedMessages.length === 0) {
      return [];
    }
    
    const groups: MessageGroup[] = [];
    let currentGroup: MessageGroup | null = null;
    
    // Time window for grouping messages (3 minutes in milliseconds)
    const timeWindow = 3 * 60 * 1000;
    
    processedMessages.forEach((message) => {
      
      // Handle both userId and user_id formats
      const messageUserId = message.user_id || message.userId;
      const currentUserId = currentUser?.userId || currentUser?.user_id;
      
      // Consistently determine if this is the current user's message
      const isCurrentUserMessage = messageUserId === currentUserId;
      
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
      
      // Replies are always in their own group
      if (message.parentId) {
        if (currentGroup) {
          groups.push(currentGroup);
          currentGroup = null;
        }
        
        groups.push({
          userId: message.userId,
          userName: message.userName,
          messages: [message],
          isCurrentUser: isCurrentUserMessage,
          type: message.type || 'text'
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
  }, [processedMessages, currentUser]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current && room.chatMessages) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [room.chatMessages]);
  
  // Debug current user and message ownership
  useEffect(() => {
    if (currentUser) {
      console.log('Current user ID:', currentUser.userId || currentUser.id);
      console.log('Current user name:', currentUser.name);
      
      if (room.chatMessages && room.chatMessages.length > 0) {
        // Log a sample of messages and whether they belong to current user
        const sampleMessages = room.chatMessages.slice(-3);
        sampleMessages.forEach(msg => {
          const msgUserId = msg.user_id || msg.userId;
          const curUserId = currentUser.userId || currentUser.user_id;
          console.log('Message from:', msg.userName || msg.user_name, 
                      'ID:', msgUserId, 
                      'Is current user:', msgUserId === curUserId);
        });
      }
    }
  }, [currentUser, room.chatMessages]);

  // Handle send message form submit
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatMessageInput.trim()) return;
    
    try {
      // In a real implementation, you would include parentId in the message
      // Here we're just simulating for the UI
      await sendMessage(chatMessageInput);
      setChatMessageInput('');
      setReplyToMessage(null);
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  // Handle reply to message
  const handleReplyClick = (message: EnhancedChatMessage) => {
    setReplyToMessage(message);
    // Focus the input field
    document.getElementById('chat-input')?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyToMessage(null);
  };

  // Format date for message groups (just the time for same day, full date for different days)
  const formatMessageDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    
    // If same day, just show time
    if (date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear()) {
      return formatChatTime(timestamp);
    }
    
    // If different day, show date and time
    return `${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${formatChatTime(timestamp)}`;
  };

  // System message component
  const SystemMessageItem = ({ message }: { message: EnhancedChatMessage }) => (
    <div className="flex items-center justify-center my-3">
      <div className="px-4 py-2 rounded-full bg-gray-100 text-center text-sm text-gray-600">
        {message.content}
      </div>
    </div>
  );

  // AI message component
  const AIMessageItem = ({ message }: { message: EnhancedChatMessage }) => (
    <div className="flex mb-4">
      <div className="flex-shrink-0 mr-2">
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.quaternary }}>
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="max-w-[80%]">
        <div className="flex items-center mb-1">
          <span className="font-bold text-sm mr-2" style={{ color: colors.quaternary }}>AI Tutor</span>
          <span className="text-xs" style={{ color: colors.textMuted }}>{formatMessageDate(message.timestamp)}</span>
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

  // Get initials for avatar
  const getInitials = (name: string) => {
    if (!name) return '?';
    
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  // Message group component
  const MessageGroupItem = ({ group }: { group: MessageGroup }) => {
    console.log('Rendering message group:', group);
    // Handle special message types
    if (group.type === 'system') {
      return <SystemMessageItem message={group.messages[0]} />;
    }
    
    if (group.type === 'ai') {
      return <AIMessageItem message={group.messages[0]} />;
    }
    
    // Check again if this is the current user to ensure consistent behavior
    // Handle both userId and user_id formats
    const messageUserId = group.userId || group.messages[0].user_id || group.messages[0].userId;
    const currentUserId = currentUser?.id || currentUser?.user_id;
    const isCurrentUser = messageUserId === currentUserId;
    
    
    const userColor = userColors.get(messageUserId) || colors.tertiary;
    const isQuestion = group.type === 'question';

    console.log('messageUserId:', messageUserId,'currentUserId:', currentUserId, 'isCurrentUser:', isCurrentUser);


    console.log
    
    return (
      <div className="flex mb-4">
        <div className="flex-shrink-0 mr-2 self-start mt-1">
          <Avatar className="w-8 h-8">
            <AvatarFallback style={{ backgroundColor: isQuestion ? colors.tertiary : userColor, color: 'white' }}>
              {getInitials(group.userName)}
            </AvatarFallback>
          </Avatar>
        </div>
        <div className="max-w-[80%]">
          <div className="flex items-center mb-1">
            <span className="font-bold text-sm mr-2" style={{ 
              color: isQuestion ? colors.tertiary : userColor
            }}>
              {group.userName} {isCurrentUser && '(You)'}
         
            </span>
            <span className="text-xs" style={{ color: colors.textMuted }}>
              {formatMessageDate(group.messages[0].timestamp)}
            </span>
          </div>
          
          <div className="flex flex-col gap-1">
            {group.messages.map((message, index) => {
              // Check if this message is a reply
              const isReply = !!message.parentId;
              
              // Determine message bubble style based on position within group
              let roundedStyle = 'rounded-lg';
              if (group.messages.length > 1) {
                if (index === 0) {
                  roundedStyle = 'rounded-lg rounded-bl-sm';
                } else if (index === group.messages.length - 1) {
                  roundedStyle = 'rounded-lg rounded-tl-sm';
                } else {
                  roundedStyle = 'rounded-lg rounded-l-sm';
                }
              }
              
              return (
                <div key={message.id} className="flex flex-col gap-1">
                  {isReply && message.parentMessage && (
                    <div className="flex items-center ml-2 mb-1">
                      <CornerDownRight className="w-3 h-3 mr-1 text-gray-400" />
                      <div className="text-xs flex items-center gap-1" style={{ color: colors.textMuted }}>
                        <span>Replying to</span>
                        <span className="font-semibold" style={{ 
                          color: message.parentMessage.userId === currentUser?.userId 
                            ? colors.primary 
                            : userColors.get(message.parentMessage.userId) || colors.textPrimary
                        }}>
                          {message.parentMessage.userName}
                        </span>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="italic text-xs cursor-pointer">
                                "{message.parentMessage.content.length > 20 
                                  ? message.parentMessage.content.substring(0, 20) + '...' 
                                  : message.parentMessage.content}"
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{message.parentMessage.content}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className={`p-3 ${roundedStyle}`} 
                    style={{ 
                      backgroundColor: isQuestion
                        ? `${colors.tertiary}15`
                        : isCurrentUser
                          ? `${colors.primary}15`
                          : colors.surface, 
                      color: colors.textPrimary,
                      border: `1px solid ${isQuestion 
                        ? `${colors.tertiary}30` 
                        : isCurrentUser 
                          ? `${colors.primary}30` 
                          : colors.border}`,
                      maxWidth: '100%'
                    }}
                  >
                    <div className="text-left">{message.content}</div>
                  </div>
                </div>
              );
            })}
          </div>
          
          <div className="flex mt-1 gap-2">
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" style={{ color: colors.textMuted }}>
              <ThumbsUp className="w-3 h-3 mr-1" /> {group.messages[0].likes || 0}
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 px-2 text-xs" 
              style={{ color: colors.textMuted }}
              onClick={() => handleReplyClick(group.messages[0])}
            >
              <MessageCircle className="w-3 h-3 mr-1" /> Reply
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Date separator component
  const DateSeparator = ({ date }: { date: string }) => {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
    
    return (
      <div className="flex items-center justify-center my-4">
        <div className="px-4 py-1 rounded-full bg-gray-100 text-center text-xs text-gray-600">
          {formattedDate}
        </div>
      </div>
    );
  };

  // Group messages by date for display
  const messagesWithDateSeparators = useMemo(() => {
    if (messageGroups.length === 0) return [];
    
    const result = [];
    let currentDate = '';
    
    messageGroups.forEach(group => {
      const messageDate = new Date(group.messages[0].timestamp).toLocaleDateString();
      
      if (messageDate !== currentDate) {
        currentDate = messageDate;
        result.push({
          type: 'date',
          date: group.messages[0].timestamp
        });
      }
      
      result.push({
        type: 'group',
        group
      });
    });
    
    return result;
  }, [messageGroups]);

  return (
    <div className="mt-6 space-y-4">
      <Card style={{ backgroundColor: colors.surface }}>
        <CardContent className="p-4">
          <div className="flex flex-col h-[400px]">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-2" ref={chatContainerRef}>
              {messagesWithDateSeparators.length > 0 ? (
                messagesWithDateSeparators.map((item, index) => (
                  item.type === 'date' ? 
                    <DateSeparator key={`date-${index}`} date={item.date} /> :
                    <MessageGroupItem key={`group-${index}`} group={item.group} />
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
              {replyToMessage && (
                <div className="mb-2 p-2 bg-gray-50 rounded-md flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CornerDownRight className="w-4 h-4 text-gray-400" />
                    <div>
                      <div className="text-xs text-gray-500">
                        Replying to <span className="font-medium">{replyToMessage.userName}</span>
                      </div>
                      <div className="text-sm truncate max-w-xs">
                        {replyToMessage.content}
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 rounded-full" 
                    onClick={cancelReply}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  id="chat-input"
                  type="text"
                  placeholder={replyToMessage ? `Reply to ${replyToMessage.userName}...` : "Type your message..."}
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