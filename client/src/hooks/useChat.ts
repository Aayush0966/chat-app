import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getChatsByUser, 
  getMessagesByChat, 
  searchUsers, 
  createChat, 
  logout, 
  deleteChatForUser, 
  deleteMessageForYourself, 
  deleteMessageForBoth,
  sendImageMessage,
} from "@/services/api";
import { useSocket } from "@/hooks/useSocket";
import type { Chat, Message, User } from "@/types/user";
import type { AxiosError } from "axios";


export const useChat = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchedUsers, setSearchedUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [messageCache, setMessageCache] = useState<Record<string, Message[]>>({});
  const [messageCursors, setMessageCursors] = useState<Record<string, string | null>>({});
  const [hasMoreMessages, setHasMoreMessages] = useState<Record<string, boolean>>({});
  const [loadingOlderMessages, setLoadingOlderMessages] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [readChats, setReadChats] = useState<Set<string>>(new Set());
  const [messagesFetched, setMessagesFetched] = useState<Set<string>>(new Set());

  // Wrap fetchMessages in useCallback
  const fetchMessages = useCallback(async (chatId: string, cursor?: string) => {
    if (!chatId) return;
    
    setMessagesLoading(true);
    try {
      const res = await getMessagesByChat(chatId, 10, cursor);
      const responseData = res.data;

      if (responseData?.messages) {
        const fetchedMessages = responseData.messages.map((msg: Message & { reads?: { userId: string }[] }) => ({
          ...msg,
          readBy: msg.reads?.map(read => read.userId) || []
        }));

        if (cursor) {
          setMessages(prev => [...fetchedMessages, ...prev]);
          setMessageCache(prev => ({
            ...prev,
            [chatId]: [...fetchedMessages, ...(prev[chatId] || [])]
          }));
        } else {
          setMessages(fetchedMessages);
          setMessageCache(prev => ({
            ...prev,
            [chatId]: fetchedMessages
          }));
        }

        setMessageCursors(prev => ({
          ...prev,
          [chatId]: responseData.nextCursor
        }));

        setHasMoreMessages(prev => ({
          ...prev,
          [chatId]: responseData.hasMore
        }));
      } else {
        if (!cursor) {
          setMessages([]);
          setMessageCache(prev => ({
            ...prev,
            [chatId]: []
          }));
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      if (!cursor) {
        setMessages([]);
        setMessageCache(prev => ({
          ...prev,
          [chatId]: []
        }));
      }
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Get socket and typing information
  const { socket, typingText, onlineUsers } = useSocket({
    setMessages,
    setChats,
    setMessageCache,
    selectedChat,
    currentUser
  });

  useEffect(() => {
    const initializeApp = async () => {
      setLoading(true);
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          setCurrentUser(JSON.parse(storedUser));
        } else {
          navigate("/auth/login");
          return;
        }        
        const chatsRes = await getChatsByUser();
        setChats(chatsRes.data || []);
        if (chatsRes.data && chatsRes.data.length > 0) {
          setSelectedChat(chatsRes.data[0]);
        }
      } catch (err: unknown) {
        if ((err as AxiosError)?.response?.status === 401 || (err as AxiosError)?.response?.status === 403) {
          localStorage.removeItem('currentUser');
          navigate("/auth/login");
        } else {
          setChats([]);
        }
      } finally {
        setLoading(false);
      }
    };
    initializeApp();
  }, [navigate]);

  // Enhanced chat switching and message loading logic
  const loadMessagesForChat = useCallback(async () => {
    if (!selectedChat || !currentUser?.id) return;

    // Mark messages as read when switching to a chat
    if (!readChats.has(selectedChat.id)) {
      socket.emit("message:readAll", selectedChat.id);
      setReadChats(prev => new Set(prev).add(selectedChat.id));
    }

    // Check if we have cached messages
    if (messageCache[selectedChat.id]) {
      setMessages(messageCache[selectedChat.id]);
      // Optionally refresh in background if messages haven't been fetched recently
      if (!messagesFetched.has(selectedChat.id)) {
        const silentFetch = async () => {
          try {
            const res = await getMessagesByChat(selectedChat.id, 10);
            if (res.data?.messages) {
              const fetchedMessages = res.data.messages.map((msg: Message & { reads?: { userId: string }[] }) => ({
                ...msg,
                readBy: msg.reads?.map(read => read.userId) || []
              }));
              setMessageCache(prev => ({
                ...prev,
                [selectedChat.id]: fetchedMessages
              }));
              setMessages(fetchedMessages);
              setMessagesFetched(prev => new Set(prev).add(selectedChat.id));
            }
          } catch (err) {
            console.error("Background fetch failed:", err);
          }
        };
        silentFetch();
      }
      return;
    }

    // If no cache, fetch fresh messages
    setMessagesLoading(true);
    try {
      await fetchMessages(selectedChat.id);
      setMessagesFetched(prev => new Set(prev).add(selectedChat.id));
    } finally {
      setMessagesLoading(false);
    }
  }, [selectedChat, currentUser?.id, messageCache, messagesFetched, readChats, socket, fetchMessages]);

  // Single effect for chat switching
  useEffect(() => {
    loadMessagesForChat();
  }, [loadMessagesForChat]);

  // Remove the duplicate effect that was here before
  // The one that checked messageCache and called fetchMessages

  // Separate effect for handling typing cleanup when changing chats
  useEffect(() => {
    return () => {
      // Cleanup on chat change
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [selectedChat?.id, typingTimeout]);

  const loadOlderMessages = async () => {
    if (!selectedChat?.id || loadingOlderMessages || !hasMoreMessages[selectedChat.id]) {
      return;
    }

    setLoadingOlderMessages(true);
    try {
      const cursor = messageCursors[selectedChat.id];
      if (cursor) {
        await fetchMessages(selectedChat.id, cursor);
      }
    } catch (err) {
      console.error("Failed to load older messages:", err);
    } finally {
      setLoadingOlderMessages(false);
    }
  };


  const handleTyping = async () => {
    if (!selectedChat?.id || !currentUser?.id) {
      return;
    }
    
    const typingDetails = {
      typingUserId: currentUser.id,
      typingUserName: (currentUser.firstName ?? '') + ' ' + (currentUser.lastName ?? ''),
      chatId: selectedChat.id
    }

    // Clear existing timeout first
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // If not already typing, emit start typing to server
    if (!isTyping) {
      setIsTyping(true);
      socket.emit("typing", typingDetails);
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit("stopTyping", typingDetails);
      setTypingTimeout(null);
    }, 5000);

    setTypingTimeout(timeout);
  }


  const handleSend = async () => {
    if (!message.trim() || !selectedChat) return;
    
    // Stop typing when sending a message
    if (isTyping && currentUser?.id) {
      setIsTyping(false);
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      socket.emit("stopTyping", {
        typingUserId: currentUser.id,
        typingUserName: (currentUser.firstName ?? '') + ' ' + (currentUser.lastName ?? ''),
        chatId: selectedChat.id
      });
    }
    
    const messageText = message;
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      chatId: selectedChat.id,
      senderId: currentUser?.id || "temp",
      text: messageText,
      sentAt: new Date().toISOString(),
      type: "TEXT",
      sender: currentUser || undefined,
      isTemp: true
    };
    
    socket.emit("newMessage", tempMessage, (response: { success: boolean; message?: Message }) => {
      if (response.success && response.message) {
        const updateWithServerMessage = (prev: Message[]) => 
          prev.map(msg => msg.id === tempMessage.id ? response.message! : msg);
        
        setMessages(prev => updateWithServerMessage(prev));
        setMessageCache(prevCache => ({
          ...prevCache,
          [selectedChat.id]: updateWithServerMessage(prevCache[selectedChat.id] || [])
        }));
      }
    });

    const updateMessages = (prev: Message[]) => [...prev, tempMessage];
    setMessages(updateMessages);
    setMessageCache(prevCache => ({
      ...prevCache,
      [selectedChat.id]: updateMessages(prevCache[selectedChat.id] || [])
    }));
    setMessage("");
    
    // Update chat list with new message
    setChats(prev => prev.map(chat => 
      chat.id === selectedChat.id 
        ? { 
            ...chat, 
            lastMessage: messageText, 
            lastMessageTime: new Date().toISOString(),
            lastMessageSenderId: currentUser?.id,
            lastMessageType: "TEXT"
          }
        : chat
    ));
  };

  const handleUserSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchedUsers([]);
      return;
    }
    
    try {
      const res = await searchUsers(query);
      // Filter out the current user from search results
      const filteredUsers = (res.data || []).filter((user: User) => user.id !== currentUser?.id);
      setSearchedUsers(filteredUsers);
    } catch (err) {
      console.error("Failed to search users:", err);
      setSearchedUsers([]);
    }
  }, [currentUser?.id]);

  const handleCreateChat = async (userId: string, userName: string) => {
    if (!currentUser?.id) {
      console.error("No current user available");
      return;
    }
    
    try {
      const res = await createChat({
        participantIds: [currentUser.id, userId],
        creatorId: currentUser.id,
        isGroup: false,
      });
      
      const chatId = res?.details?.id || res?.data?.chatId;
      
      if (chatId) {
        const existingChat = chats.find((chat: Chat) => chat.id === chatId);
        
        if (existingChat) {
          setSelectedChat(existingChat);
        } else {
          const newChat: Chat = {
            id: chatId,
            name: userName,
            isGroup: false,
            lastMessage: null,
            lastMessageTime: null,
            lastMessageType: null
          };
          
          setChats(prev => [newChat, ...prev]);
          setSelectedChat(newChat);
        }
        
        setShowNewChat(false);
        setUserSearchQuery("");
        setSearchedUsers([]);
        setIsMobileSidebarOpen(false);
      }
    } catch (err: unknown) {
      console.error("Failed to create chat:", err);
      
      if ((err as AxiosError)?.response?.status === 409) {
        const existingChat = chats.find((chat: Chat) => 
          !chat.isGroup && chat.name === userName
        );
        
        if (existingChat) {
          setSelectedChat(existingChat);
          setShowNewChat(false);
          setUserSearchQuery("");
          setSearchedUsers([]);
          setIsMobileSidebarOpen(false);
        } else {
          try {
            const chatsRes = await getChatsByUser();
            const updatedChats = chatsRes.data || [];
            setChats(updatedChats);
            
            const foundChat = updatedChats.find((chat: Chat) => 
              !chat.isGroup && chat.name === userName
            );
            
            if (foundChat) {
              setSelectedChat(foundChat);
            }
            
            setShowNewChat(false);
            setUserSearchQuery("");
            setSearchedUsers([]);
            setIsMobileSidebarOpen(false);
          } catch (refreshErr) {
            console.error("Failed to refresh chats:", refreshErr);
          }
        }
      }
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChatForUser(chatId);
      setChats(prev => prev.filter(chat => chat.id !== chatId));
      // Clear cache for the deleted chat
      setMessageCache(prev => {
        const newCache = { ...prev };
        delete newCache[chatId];
        return newCache;
      });
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const handleDeleteMessage = async (messageId: string, deleteForBoth: boolean = false) => {
    if (!selectedChat || !currentUser?.id) return;

    try {
      if (deleteForBoth) {
        await deleteMessageForBoth(messageId);
        // Emit socket event for real-time deletion
        socket.emit("messageDelete", {
          messageId,
          chatId: selectedChat.id,
          deletedBy: currentUser.id
        });
      } else {
        await deleteMessageForYourself(messageId);
      }

      const updateMessages = (prev: Message[]) => prev.filter(msg => msg.id !== messageId);
      setMessages(updateMessages);
      // Update cache as well
      if (selectedChat) {
        setMessageCache(prevCache => ({
          ...prevCache,
          [selectedChat.id]: updateMessages(prevCache[selectedChat.id] || [])
        }));
      }
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleLogout = async () => {
    // Clean up typing state before logout
    if (isTyping && typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
      setIsTyping(false);
    }
    
    try {
      // Emit logout event to socket server before disconnecting
      if (socket && currentUser?.id) {
        socket.emit("userLogout", currentUser.id);
      }

      // Disconnect socket
      if (socket) {
        socket.disconnect();
      }

      // Call logout API
      await logout();
      
      // Clear user data
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setChats([]);
      setMessages([]);
      setSelectedChat(null);
      setMessageCache({});
      
      navigate("/auth/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setIsMobileSidebarOpen(false);
  };

  const handleSendImage = async (file: File) => {
    if (!selectedChat || !currentUser) return;
    
    const tempMessage: Message = {
      id: Date.now().toString(),
      chatId: selectedChat.id,
      senderId: currentUser.id,
      text: "",
      sentAt: new Date().toISOString(),
      type: "ATTACHMENT",
      attachment: URL.createObjectURL(file),
      isUploading: true,
      sender: currentUser
    };
    
    try {
      // Emit to socket for real-time updates (with loading state)
      socket.emit("newMessage", tempMessage);

      // Update messages and cache immediately
      const updateMessages = (prev: Message[]) => [...prev, tempMessage];
      setMessages(updateMessages);
      setMessageCache(prevCache => ({
        ...prevCache,
        [selectedChat.id]: updateMessages(prevCache[selectedChat.id] || [])
      }));
      
      // Send image to server
      const res = await sendImageMessage(selectedChat.id, file);
      
      if (res?.data) {
        // Create the final message with server data
        const serverMessage: Message = {
          ...res.data,
          isUploading: false
        };
        
        // Replace temporary message with server response
        const updateWithServerMessage = (prev: Message[]) => prev.map(msg => 
          msg.id === tempMessage.id ? serverMessage : msg
        );
        setMessages(updateWithServerMessage);
        setMessageCache(prevCache => ({
          ...prevCache,
          [selectedChat.id]: updateWithServerMessage(prevCache[selectedChat.id] || [])
        }));
        
        // Emit the final message to other users via socket
        socket.emit("newMessage", serverMessage);
        
        // Update chat list with last message
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { 
                ...chat, 
                lastMessage: "📷 Image", 
                lastMessageTime: new Date().toISOString(),
                lastMessageSenderId: currentUser.id,
                lastMessageType: "ATTACHMENT"
              }
            : chat
        ));
        
        // Clean up temporary blob URL
        URL.revokeObjectURL(tempMessage.attachment!);
      }
    } catch (err) {
      console.error("Failed to send image:", err);
      
      // Remove failed message
      const removeFailedMessage = (prev: Message[]) => prev.filter(msg => msg.id !== tempMessage.id);
      setMessages(removeFailedMessage);
      setMessageCache(prevCache => ({
        ...prevCache,
        [selectedChat.id]: removeFailedMessage(prevCache[selectedChat.id] || [])
      }));
      
      // Clean up temporary blob URL
      URL.revokeObjectURL(tempMessage.attachment!);
      
      throw err; // Re-throw for the ImageUpload component to handle
    }
  };

  // Load cached messages or fetch new ones when chat is selected
  useEffect(() => {
    if (!selectedChat) return;

    const cachedMessages = messageCache[selectedChat.id];
    if (cachedMessages) {
      setMessages(cachedMessages);
      setHasMoreMessages(prev => ({
        ...prev,
        [selectedChat.id]: prev[selectedChat.id] || false
      }));
    } else {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat, messageCache, fetchMessages, setHasMoreMessages]);

  return {
    chats,
    selectedChat,
    message,
    messages,
    loading,
    messagesLoading,
    searchQuery,
    showNewChat,
    userSearchQuery,
    searchedUsers,
    currentUser,
    isMobileSidebarOpen,
    typingText,
    onlineUsers,
    loadingOlderMessages,
    hasMoreMessages: hasMoreMessages[selectedChat?.id || ''] || false,
    socket,
    setMessage,
    setSearchQuery,
    setShowNewChat,
    setUserSearchQuery,
    setIsMobileSidebarOpen,
    handleSend,
    handleUserSearch,
    handleCreateChat,
    handleDeleteChat,
    handleDeleteMessage,
    handleLogout,
    handleTyping,
    handleChatSelect,
    handleSendImage,
    loadOlderMessages,
  };
};