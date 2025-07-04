import { useEffect, useState } from "react";
import socket from "@/services/socket";
import type { Message, Chat, TypingData, User } from "@/types/user";

interface UseSocketProps {
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    setMessageCache: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
    selectedChat: Chat | null;
    currentUser: User | null;
}

export const useSocket = ({ setMessages, setChats, setMessageCache, selectedChat, currentUser }: UseSocketProps) => {
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
    const [onlineUsers, setOnlineUsers] = useState<Record<string, boolean>>({});

    // Handle browser close/refresh
    useEffect(() => {
        const handleBeforeUnload = () => {
            if (socket && currentUser?.id) {
                // Try to notify server about disconnection
                socket.emit("userLogout", currentUser.id);
                socket.disconnect();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentUser?.id]);

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        const handleConnect = () => {
            console.log("🔌 Socket connected");
            // Clear online users first
            setOnlineUsers({});
            if (currentUser?.id) {
                socket.emit("userConnected", currentUser.id);
            }
            socket.emit("ping", "Ping from client");
        };

        const handleDisconnect = () => {
            console.log("🔌 Socket disconnected");
            // Clear online users on disconnect
            setOnlineUsers({});
        };

        const handleReconnect = () => {
            console.log("🔌 Socket reconnecting...");
            setOnlineUsers({});
            if (currentUser?.id) {
                socket.emit("userConnected", currentUser.id);
            }
        };

        const handleNewMessage = (data: { message: Message }) => {
            if (selectedChat && data.message.chatId === selectedChat.id) {
                setMessages((prev: Message[]) => {
                    // Check if this is an update to an existing message (for image uploads)
                    const existingMsgIndex = prev.findIndex(msg => 
                        msg.id === data.message.id || 
                        (msg.isUploading && msg.senderId === data.message.senderId && msg.type === data.message.type)
                    );
                    
                    if (existingMsgIndex !== -1) {
                        // Update existing message
                        const updatedMessages = [...prev];
                        updatedMessages[existingMsgIndex] = data.message;
                        return updatedMessages;
                    } else {
                        // Add new message if it doesn't exist
                        if (prev.some((msg) => msg.id === data.message.id)) return prev;
                        return [...prev, data.message];
                    }
                });
            }

            setMessageCache((prevCache) => {
                const chatMessages = prevCache[data.message.chatId] || [];
                
                // Check if this is an update to an existing message
                const existingMsgIndex = chatMessages.findIndex(msg => 
                    msg.id === data.message.id || 
                    (msg.isUploading && msg.senderId === data.message.senderId && msg.type === data.message.type)
                );
                
                if (existingMsgIndex !== -1) {
                    // Update existing message in cache
                    const updatedMessages = [...chatMessages];
                    updatedMessages[existingMsgIndex] = data.message;
                    return {
                        ...prevCache,
                        [data.message.chatId]: updatedMessages
                    };
                } else {
                    // Add new message to cache
                    return {
                        ...prevCache,
                        [data.message.chatId]: [...chatMessages, data.message]
                    };
                }
            });

            setChats((prev: Chat[]) => {
                const updatedChats = prev.map(chat =>
                    chat.id === data.message.chatId
                        ? {
                            ...chat,
                            lastMessage: data.message.type === "ATTACHMENT" 
                              ? "📷 Image"
                              : data.message.text,
                            lastMessageTime: data.message.sentAt,
                            lastMessageSenderId: data.message.senderId
                        }
                        : chat
                );

                const updatedChatIndex = updatedChats.findIndex(chat => chat.id === data.message.chatId);
                if (updatedChatIndex > 0) {
                    const updatedChat = updatedChats[updatedChatIndex];
                    const otherChats = updatedChats.filter((_, index) => index !== updatedChatIndex);
                    return [updatedChat, ...otherChats];
                }

                return updatedChats;
            });
        };

        const handleStartTyping = (data: TypingData) => {
            if (selectedChat && data.chatId === selectedChat.id) {
                setTypingUsers(prev => ({
                    ...prev,
                    [data.typingUserId]: data.typingUserName
                }));
            }
        };

        const handleStopTyping = (data: TypingData) => {
            if (selectedChat && data.chatId === selectedChat.id) {
                setTypingUsers(prev => {
                    const updated = { ...prev };
                    delete updated[data.typingUserId];
                    return updated;
                });
            }
        };

        const handleUserStatusChanged = (data: { userId: string; status: 'online' | 'offline', firstName: string }) => {
            console.log(`👤 User ${data.firstName} is now ${data.status}`);
            setOnlineUsers(prev => ({
                ...prev,
                [data.userId]: data.status === 'online'
            }));
        };

        const handleMessageDeleted = (data: { messageId: string, chatId: string, deletedBy: string }) => {
            // Update messages if we're in the chat where the message was deleted
            if (selectedChat && data.chatId === selectedChat.id) {
                setMessages((prev: Message[]) => prev.filter(msg => msg.id !== data.messageId));
            }

            // Update message cache
            setMessageCache((prevCache) => {
                const chatMessages = prevCache[data.chatId];
                if (chatMessages) {
                    return {
                        ...prevCache,
                        [data.chatId]: chatMessages.filter(msg => msg.id !== data.messageId)
                    };
                }
                return prevCache;
            });
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnect", handleReconnect);
        socket.on("userStatusChanged", handleUserStatusChanged);
        socket.on("newMessage", handleNewMessage);
        socket.on("startTyping", handleStartTyping);
        socket.on("stopTyping", handleStopTyping);
        socket.on("messageDeleted", handleMessageDeleted);

        // If already connected when mounting, emit userConnected
        if (socket.connected && currentUser?.id) {
            socket.emit("userConnected", currentUser.id);
        }

        // Clean up
        return () => {
            socket.off("connect", handleConnect);
            socket.off("disconnect", handleDisconnect);
            socket.off("reconnect", handleReconnect);
            socket.off("userStatusChanged", handleUserStatusChanged);
            socket.off("newMessage", handleNewMessage);
            socket.off("startTyping", handleStartTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("messageDeleted", handleMessageDeleted);
        };
    }, [setMessages, setChats, setMessageCache, selectedChat, currentUser]);

    const checkUserStatus = (userId: string) => {
        socket.emit("getUserStatus", userId);
    };

    // Get typing indicator text
    const typingUsersArray = Object.values(typingUsers);
    const typingText = typingUsersArray.length > 0 
        ? `${typingUsersArray.join(', ')} ${typingUsersArray.length === 1 ? 'is' : 'are'} typing...`
        : '';

    return { socket, typingText, onlineUsers, checkUserStatus };
};
