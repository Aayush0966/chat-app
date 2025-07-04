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
                    if (prev.some((msg) => msg.id === data.message.id)) return prev;
                    return [...prev, data.message];
                });
            }

            setMessageCache((prevCache) => {
                if (prevCache[data.message.chatId]) {
                    return {
                        ...prevCache,
                        [data.message.chatId]: [...prevCache[data.message.chatId], data.message]
                    };
                }
                return prevCache;
            });

            setChats((prev: Chat[]) => {
                const updatedChats = prev.map(chat =>
                    chat.id === data.message.chatId
                        ? {
                            ...chat,
                            lastMessage: data.message.text,
                            lastMessageTime: data.message.sentAt
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

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnect", handleReconnect);
        socket.on("userStatusChanged", handleUserStatusChanged);
        socket.on("newMessage", handleNewMessage);
        socket.on("startTyping", handleStartTyping);
        socket.on("stopTyping", handleStopTyping);

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
