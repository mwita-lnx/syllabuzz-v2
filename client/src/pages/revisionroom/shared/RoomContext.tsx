import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import socketService from '@/services/socket-service';
import roomService from '@/services/room-service';
import pollService from '@/services/poll-service';
import { getUser } from '@/services/api-backend';
import { RevisionRoom, ChatMessage, Poll, Faculty } from '@/types/index3';

// Define the context shape
type RoomContextType = {
  currentRoom: RevisionRoom | null;
  setCurrentRoom: React.Dispatch<React.SetStateAction<RevisionRoom | null>>;
  isLoading: boolean;
  error: string | null;
  loadRoom: (id: string) => Promise<void>;
  leaveRoom: () => void;
  sendMessage: (message: string) => Promise<void>;
  updateStatus: (status: 'studying' | 'idle' | 'away') => void;
  roomUserStatus: 'studying' | 'idle' | 'away';
  joinRoom: (room: RevisionRoom) => void;
  currentPoll: Poll | null;
  votePoll: (optionId: string) => Promise<void>;
  showAITutor: boolean;
  setShowAITutor: React.Dispatch<React.SetStateAction<boolean>>;
  faculties: Faculty[];
  formatDate: (dateString: string) => string;
  formatChatTime: (dateString: string) => string;
};

// Create the context
const RoomContext = createContext<RoomContextType | undefined>(undefined);

// Create a provider component
export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRoom, setCurrentRoom] = useState<RevisionRoom | null>(null);
  const [currentPoll, setCurrentPoll] = useState<Poll | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [roomUserStatus, setRoomUserStatus] = useState<'studying' | 'idle' | 'away'>('idle');
  const [showAITutor, setShowAITutor] = useState<boolean>(false);
  const [faculties] = useState<Faculty[]>([
    { id: '1', name: 'Science', code: 'sci', color: '#FF6B6B' },
    { id: '2', name: 'Arts', code: 'arts', color: '#4ECDC4' },
    { id: '3', name: 'Business', code: 'bus', color: '#FFD166' },
    { id: '4', name: 'Engineering', code: 'eng', color: '#6A0572' },
    { id: '5', name: 'Medicine', code: 'med', color: '#06D6A0' }
  ]);
  
  const currentUser = getUser();
  const socketInitialized = useRef(false);
  const currentRoomId = useRef<string | null>(null);
  
  // Memoize event handlers to maintain consistent references
  const handleNewMessage = useCallback((message: ChatMessage) => {
    console.log('New message received in context:', message);
    
    setCurrentRoom(prev => {
      if (!prev) return prev;
      
      // Create a new messages array if it doesn't exist yet
      const prevMessages = prev.chatMessages || [];
      
      // Simply add the message received from the server
      return { ...prev, chatMessages: [...prevMessages, message] };
    });
  }, []);
  
  const handleParticipantJoined = useCallback((data: { roomId: string, participant: any }) => {
    console.log('Participant joined event in context:', data);
    setCurrentRoom(prev => {
      if (!prev || prev.id !== data.roomId) return prev;
      
      // Check if participant already exists
      const participantExists = prev.participants.some(
        p => p.user_id === data.participant.userId
      );
      
      if (!participantExists) {
        const updatedParticipants = [...prev.participants, {
          user_id: data.participant.userId,
          user_name: data.participant.name,
          status: 'active',
          joined_at: new Date().toISOString()
        }];
        
        return {
          ...prev,
          participants: updatedParticipants,
          activeMembers: (prev.activeMembers || 0) + 1,
          memberCount: (prev.memberCount || 0) + 1
        };
      }
      
      return prev;
    });
  }, []);
  
  const handleParticipantLeft = useCallback((data: { roomId: string, userId: string }) => {
    console.log('Participant left event in context:', data);
    setCurrentRoom(prev => {
      if (!prev || prev.id !== data.roomId) return prev;
      
      const updatedParticipants = prev.participants.map(p => 
        p.user_id === data.userId 
          ? { ...p, status: 'away', left_at: new Date().toISOString() } 
          : p
      );
      
      return {
        ...prev,
        participants: updatedParticipants,
        activeMembers: Math.max(0, (prev.activeMembers || 0) - 1)
      };
    });
  }, []);
  
  const handleStatusUpdated = useCallback((data: { roomId: string, userId: string, status: string }) => {
    console.log('Status updated event in context:', data);
    setCurrentRoom(prev => {
      if (!prev || prev.id !== data.roomId) return prev;
      
      const updatedParticipants = prev.participants.map(p => 
        p.user_id === data.userId 
          ? { ...p, status: data.status as 'active' | 'idle' | 'away' } 
          : p
      );
      
      return { ...prev, participants: updatedParticipants };
    });
  }, []);
  
  const handlePollUpdated = useCallback((data: Partial<Poll> & { id: string }) => {
    console.log('Poll updated event in context:', data);
    if (currentPoll && currentPoll.id === data.id && data.options) {
      setCurrentPoll(prev => {
        if (!prev) return null;
        return { ...prev, ...data };
      });
    }
  }, [currentPoll]);
  
  const handleRoomUpdated = useCallback((data: Partial<RevisionRoom> & { id: string }) => {
    console.log('Room updated event in context:', data);
    setCurrentRoom(prev => {
      if (!prev || prev.id !== data.id) return prev;
      return { ...prev, ...data };
    });
  }, []);
  
  const handleSocketError = useCallback((error: any) => {
    console.error('Socket error received in context:', error);
    setError(`Socket error: ${error.message || 'Unknown error'}`);
  }, []);

  // Initialize socket connection once on mount
  useEffect(() => {
    const initializeSocket = async () => {
      console.log('Initializing socket connection on mount');
      try {
        const success = await socketService.init();
        if (success) {
          console.log('Socket initialized successfully on mount');
        } else {
          console.error('Failed to initialize socket on mount');
          setError('Failed to connect to real-time service');
        }
      } catch (err) {
        console.error('Error initializing socket on mount:', err);
        setError('Failed to connect to real-time service');
      }
    };

    initializeSocket();

    // Cleanup when the provider is unmounted
    return () => {
      console.log('RoomProvider unmounting - global cleanup');
      if (currentRoomId.current) {
        console.log('Leaving room on provider unmount:', currentRoomId.current);
        socketService.leaveRoom(currentRoomId.current);
      }
      socketService.close();
    };
  }, []); // Empty dependency array - only run once on mount

  // Setup socket event listeners
  useEffect(() => {
    console.log("Setting up socket event listeners");
    
    // Register all event handlers
    socketService.on('new_message', handleNewMessage);
    socketService.on('participant_joined', handleParticipantJoined);
    socketService.on('participant_left', handleParticipantLeft);
    socketService.on('status_updated', handleStatusUpdated);
    socketService.on('poll_updated', handlePollUpdated);
    socketService.on('room_updated', handleRoomUpdated);
    socketService.on('socket_error', handleSocketError);
    
    // Clean up event listeners when component unmounts
    return () => {
      console.log("Cleaning up socket event listeners");
      socketService.off('new_message', handleNewMessage);
      socketService.off('participant_joined', handleParticipantJoined);
      socketService.off('participant_left', handleParticipantLeft);
      socketService.off('status_updated', handleStatusUpdated);
      socketService.off('poll_updated', handlePollUpdated);
      socketService.off('room_updated', handleRoomUpdated);
      socketService.off('socket_error', handleSocketError);
    };
  }, [
    handleNewMessage,
    handleParticipantJoined,
    handleParticipantLeft,
    handleStatusUpdated,
    handlePollUpdated,
    handleRoomUpdated,
    handleSocketError
  ]);

  // Join room when currentRoom changes and socket is initialized
  useEffect(() => {
    // Skip if no current room
    if (!currentRoom) {
      console.log('No current room, skipping socket room join');
      return;
    }

    // Record the current room ID
    currentRoomId.current = currentRoom.id;
    
    const setupRoomConnection = async () => {
      // Skip if socket event handlers already set up for this room
      if (socketInitialized.current && currentRoomId.current === currentRoom.id) {
        console.log('Socket already initialized for this room:', currentRoom.id);
        return;
      }
      
      console.log('Setting up socket connection for room:', currentRoom.id);
      
      // Initialize socket if needed
      if (!socketService.isConnected()) {
        console.log('Socket not connected, initializing...');
        const success = await socketService.init();
        if (!success) {
          console.error('Failed to initialize socket for room join');
          setError('Failed to connect to real-time service');
          return;
        }
      }
      
      // Join the room
      console.log('Joining room:', currentRoom.id);
      socketService.joinRoom(currentRoom.id);
      socketInitialized.current = true;
      
      // Load active poll
      try {
        console.log('Loading active poll for room:', currentRoom.id);
        const pollResponse = await pollService.getRoomPolls(currentRoom.id);
        if (pollResponse.success && pollResponse.data) {
          setCurrentPoll(pollResponse.data[0]);
        }
      } catch (err) {
        console.error('Error loading active poll:', err);
      }
    };
    
    setupRoomConnection();
    
    // Cleanup function when leaving room
    return () => {
      // We don't leave the room here - we'll handle that in the leaveRoom function
      // or in the global cleanup effect
    };
  }, [currentRoom?.id]); // Only re-run if the room ID changes

  // Load a specific room (memoized to prevent recreation)
  const loadRoom = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading room data for ID:', id);
      const roomResponse = await roomService.getRoom(id);
      
      if (roomResponse.success && roomResponse.data) {
        console.log('Room data loaded successfully:', roomResponse.data.id);
        
        // Get chat history separately
        try {
          console.log('Loading chat history for room:', id);
          const messagesResponse = await roomService.getRoomMessages(id, { limit: 100 });
          
          if (messagesResponse.success && messagesResponse.data) {
            console.log(`Loaded ${messagesResponse.data.length} chat messages`);
            
            // Set the current room with chat messages
            setCurrentRoom({
              ...roomResponse.data,
              chatMessages: messagesResponse.data
            });
          } else {
            // Set room without messages
            setCurrentRoom(roomResponse.data);
            console.warn('Failed to load chat messages:', messagesResponse.error);
          }
        } catch (msgErr) {
          // Set room without messages if message loading fails
          setCurrentRoom(roomResponse.data);
          console.error('Error loading chat messages:', msgErr);
        }
      } else {
        console.error('Failed to load room:', roomResponse.error);
        setError(roomResponse.error || 'Failed to load room');
      }
    } catch (err) {
      console.error('Error loading room:', err);
      setError('An error occurred while loading the room');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Join a revision room
  const joinRoom = useCallback((room: RevisionRoom) => {
    console.log('Joining room from context:', room.id);
    setCurrentRoom(room);
    setRoomUserStatus('idle');
  }, []);
  
  // Leave current room
  const leaveRoom = useCallback(() => {
    if (currentRoom) {
      console.log('Leaving room from context:', currentRoom.id);
      socketService.leaveRoom(currentRoom.id);
      currentRoomId.current = null;
      socketInitialized.current = false;
    }
    
    setCurrentRoom(null);
    setRoomUserStatus('idle');
  }, [currentRoom]);
  
  // Send a chat message
  const sendMessage = useCallback(async (message: string): Promise<void> => {
    if (!message.trim() || !currentRoom) {
      console.error('Cannot send message: No message or room');
      return Promise.reject('No message or room');
    }
    
    try {
      console.log('Sending message to room:', currentUser);
      
      const userId = currentUser?.userId || 'anonymous';
      const userName = currentUser?.name || 'Anonymous User';
      
      // Send message via socket
      socketService.sendChatMessage(currentRoom.id, {
        userId,
        userName,
        content: message,
        type: 'text'
      });
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error sending message:', err);
      return Promise.reject(err);
    }
  }, [currentRoom, currentUser]);
  
  // Update user status
  const updateStatus = useCallback((status: 'studying' | 'idle' | 'away') => {
    if (!currentRoom) {
      console.log('Cannot update status: No current room');
      return;
    }
    
    console.log('Updating status to:', status);
    
    // Update user status locally
    setRoomUserStatus(status);
    
    // Notify via socket
    socketService.updateStatus(currentRoom.id, status);
  }, [currentRoom]);
  
  // Vote in poll
  const votePoll = useCallback(async (optionId: string): Promise<void> => {
    if (!currentPoll || !currentRoom) {
      console.error('Cannot vote: No poll or room');
      return Promise.reject('No poll or room');
    }
    
    try {
      console.log('Voting in poll:', currentPoll.id, 'option:', optionId);
      
      // Emit socket event for vote
      socketService.votePoll(currentRoom.id, currentPoll.id, optionId);
      
      // Update the poll with the new vote (optimistically)
      const updatedOptions = currentPoll.options.map(option => {
        if (option.id === optionId) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      });
      
      setCurrentPoll({
        ...currentPoll,
        options: updatedOptions,
        totalVotes: currentPoll.totalVotes + 1
      });
      
      return Promise.resolve();
    } catch (err) {
      console.error('Error voting in poll:', err);
      return Promise.reject(err);
    }
  }, [currentRoom, currentPoll]);
  
  // Format date (memoized)
  const formatDate = useCallback((dateString: string): string => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }, []);
  
  // Format time (memoized)
  const formatChatTime = useCallback((dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  }, []);

  // Combine all values and functions
  const value = {
    currentRoom,
    setCurrentRoom,
    isLoading,
    error,
    loadRoom,
    leaveRoom,
    sendMessage,
    updateStatus,
    roomUserStatus,
    joinRoom,
    currentPoll,
    votePoll,
    showAITutor,
    setShowAITutor,
    faculties,
    formatDate,
    formatChatTime
  };

  return <RoomContext.Provider value={value}>{children}</RoomContext.Provider>;
};

// Custom hook for using the context
export const useRoomContext = () => {
  const context = useContext(RoomContext);
  if (context === undefined) {
    throw new Error('useRoomContext must be used within a RoomProvider');
  }
  return context;
};