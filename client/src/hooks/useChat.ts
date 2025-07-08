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
  getUnreadMessages
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


  useEffect(() => {
    if (selectedChat && !readChats.has(selectedChat.id)) {
      if (currentUser?.id) {
        socket.emit("message:readAll", selectedChat.id);
        setReadChats(prev => {
          const updated = new Set(prev).add(selectedChat.id);
          return updated;
        });
      }

      if (messageCache[selectedChat.id]) {
        setMessages(messageCache[selectedChat.id]);
      } else {
        fetchMessages(selectedChat.id);
      }
    }
  }, [selectedChat, messageCache, currentUser?.id, socket, readChats]);

  // Separate effect for handling typing cleanup when changing chats
  useEffect(() => {
    return () => {
      // Cleanup on chat change
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [selectedChat?.id, typingTimeout]);

  const fetchMessages = async (chatId: string, cursor?: string) => {
    setMessagesLoading(true);
    try {
      const res = await getMessagesByChat(chatId, 10, cursor);
      const responseData = res.data;

      if (responseData && responseData.messages) {
        const fetchedMessages = responseData.messages.map((msg: Message & { reads?: { userId: string }[] }) => ({
          ...msg,
          readBy: msg.reads?.map(read => read.userId) || [] // Map reads to readBy
        }));

        if (cursor) {
          // Loading older messages - prepend to existing messages
          setMessages(prev => [...fetchedMessages, ...prev]);
          setMessageCache(prev => ({
            ...prev,
            [chatId]: [...fetchedMessages, ...(prev[chatId] || [])]
          }));
        } else {
          // Initial load - set messages directly
          setMessages(fetchedMessages);
          setMessageCache(prev => ({
            ...prev,
            [chatId]: fetchedMessages
          }));
        }

        // Update pagination state
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
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      if (!cursor) {
        setMessages([]);
      }
    } finally {
      setMessagesLoading(false);
    }
  };

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

  const handleMarkMessageAsRead = useCallback((messageId: string) => {
    if (selectedChat && currentUser?.id) {
      // Find the message to check if current user is the receiver
      const message = messages.find(msg => msg.id === messageId);
      if (!message || message.senderId === currentUser.id) {
        // Don't mark as read if message not found or current user is the sender
        return;
      }

      socket.emit("message:read", messageId, selectedChat.id, (response: { success: boolean; error?: string }) => {
        if (response?.success) {
          setReadChats((prev) => {
            const updated = new Set(prev);
            updated.add(selectedChat.id);
            console.log(`[DEBUG] Updated readChats state:`, Array.from(updated));
            return updated;
          });
        } else {
          console.error(`Failed to mark message as read on server: ${messageId}`, response?.error);
        }
      });
    }
  }, [selectedChat, currentUser?.id, socket, messages]);

  useEffect(() => {
    if (messages.length > 0 && currentUser?.id) {
      const unreadMessages = messages.filter(msg => 
        !msg.readBy?.includes(currentUser.id) && 
        msg.senderId !== currentUser.id
      );

      if (unreadMessages.length === 0) {
        return;
      }

      unreadMessages.forEach(unreadMessage => {
        handleMarkMessageAsRead(unreadMessage.id);
        // Update the readBy property locally
        setMessages(prevMessages => prevMessages.map(msg => 
          msg.id === unreadMessage.id 
            ? { ...msg, readBy: [...(msg.readBy || []), currentUser.id] }
            : msg
        ));
      });
    }
  }, [messages, currentUser?.id, handleMarkMessageAsRead]);

  useEffect(() => {
    const handleMessageReadNotify = (data: { messageId: string, userId: string, chatId: string }) => {
      setMessages(prevMessages => prevMessages.map(msg => {
        if (msg.id === data.messageId) {
          const readBy = Array.from(new Set([...(msg.readBy || []), data.userId]));
          console.log("[DEBUG] Updated readBy array for message:", msg.id, readBy);
          return { ...msg, readBy };
        }
        return msg;
      }));

      // Also update the message cache
      if (selectedChat) {
        setMessageCache(prevCache => ({
          ...prevCache,
          [selectedChat.id]: prevCache[selectedChat.id]?.map(msg => {
            if (msg.id === data.messageId) {
              const readBy = Array.from(new Set([...(msg.readBy || []), data.userId]));
              return { ...msg, readBy };
            }
            return msg;
          }) || []
        }));
      }
    };

    const handleChatReadAllNotify = (data: { chatId: string, userId: string }) => {
      if (selectedChat?.id === data.chatId) {
        setMessages(prevMessages => prevMessages.map(msg => 
          ({ ...msg, readBy: [...(msg.readBy || []), data.userId] })
        ));
      }
    };

    socket.on("message:notify", handleMessageReadNotify);
    socket.on("chat:readAll:notify", handleChatReadAllNotify);

    return () => {
      socket.off("message:notify", handleMessageReadNotify);
      socket.off("chat:readAll:notify", handleChatReadAllNotify);
    };
  }, [socket, selectedChat]);

  useEffect(() => {
    const fetchUnreadMessages = async () => {
      if (selectedChat && currentUser?.id) {
        try {
          console.log("[DEBUG] Fetching unread messages for chat:", selectedChat.id);
          const unreadMessages = await getUnreadMessages(selectedChat.id);

          if (!unreadMessages || unreadMessages.length === 0) {
            console.log("[DEBUG] No unread messages available for chat:", selectedChat.id);
            return; // Stop further processing if no unread messages are found
          }

          console.log("[DEBUG] Unread messages fetched:", unreadMessages);
          setMessages(prevMessages => prevMessages.map(msg => {
            const isUnread = unreadMessages.some((unread: { id: string }) => unread.id === msg.id);
            return isUnread ? { ...msg, isUnread: true } : msg;
          }));
        } catch (err) {
          const axiosError = err as AxiosError;
          if (axiosError.response?.status === 404) {
            console.log("[DEBUG] No unread messages found (404):", axiosError);
          } else {
            console.error("[DEBUG] Failed to fetch unread messages:", axiosError);
          }
        }
      }
    };

    fetchUnreadMessages();
  }, [selectedChat, currentUser?.id]);

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