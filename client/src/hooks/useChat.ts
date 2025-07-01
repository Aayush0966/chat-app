import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { 
  getChatsByUser, 
  sendMessage, 
  getMessagesByChat, 
  searchUsers, 
  createChat, 
  logout, 
  deleteChatForUser, 
  deleteMessageForYourself, 
  deleteMessageForBoth 
} from "@/services/api";
import type { Chat, Message, User } from "@/types/user";

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
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
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
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  const fetchMessages = async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const res = await getMessagesByChat(chatId);
      setMessages(res.data ? res.data.reverse() : []);
    } catch (err) {
      console.error("Failed to fetch messages:", err);
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || !selectedChat) return;
    
    const messageText = message;
    const tempMessage: Message = {
      id: Date.now().toString(),
      chatId: selectedChat.id,
      senderId: currentUser?.id || "temp",
      text: messageText,
      sentAt: new Date().toISOString(),
      type: "TEXT",
      sender: currentUser || undefined
    };
    
    setMessages(prev => [...prev, tempMessage]);
    setMessage("");
    
    try {
      const res = await sendMessage({
        chatId: selectedChat.id,
        text: messageText,
        messageType: "TEXT",
      });
      
      if (res?.data) {
        setMessages(prev => prev.map(msg => 
          msg.id === tempMessage.id ? res.data : msg
        ));
        
        setChats(prev => prev.map(chat => 
          chat.id === selectedChat.id 
            ? { ...chat, lastMessage: messageText, lastMessageTime: new Date().toISOString() }
            : chat
        ));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
    }
  };

  const handleUserSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchedUsers([]);
      return;
    }
    
    try {
      const res = await searchUsers(query);
      setSearchedUsers(res.data || []);
    } catch (err) {
      console.error("Failed to search users:", err);
      setSearchedUsers([]);
    }
  }, []);

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
            lastMessageTime: null
          };
          
          setChats(prev => [newChat, ...prev]);
          setSelectedChat(newChat);
        }
        
        setShowNewChat(false);
        setUserSearchQuery("");
        setSearchedUsers([]);
        setIsMobileSidebarOpen(false);
      }
    } catch (err: any) {
      console.error("Failed to create chat:", err);
      
      if (err?.response?.status === 409 && err?.response?.data?.error?.includes("already exists")) {
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
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    } catch (err) {
      console.error("Failed to delete chat:", err);
    }
  };

  const handleDeleteMessage = async (messageId: string, deleteForBoth: boolean = false) => {
    try {
      if (deleteForBoth) {
        await deleteMessageForBoth(messageId);
      } else {
        await deleteMessageForYourself(messageId);
      }
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setCurrentUser(null);
      navigate("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      navigate("/auth/login");
    }
  };

  const handleChatSelect = (chat: Chat) => {
    setSelectedChat(chat);
    setIsMobileSidebarOpen(false);
  };

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
    handleChatSelect,
  };
}; 