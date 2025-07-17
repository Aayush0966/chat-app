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

        const handleMessageDelivered = (data: { messageId: string, chatId: string }) => {
            if (selectedChat && data.chatId === selectedChat.id) {
                setMessages((prev: Message[]) => prev.map(msg => 
                    msg.id === data.messageId ? { ...msg, delivered: true } : msg
                ));
            }

            setMessageCache((prevCache) => {
                const chatMessages = prevCache[data.chatId] || [];
                return {
                    ...prevCache,
                    [data.chatId]: chatMessages.map(msg => 
                        msg.id === data.messageId ? { ...msg, delivered: true } : msg
                    )
                };
            });
        };

        const handleMessageRead = (data: { messageId: string, chatId: string, userId: string }) => {
            if (selectedChat && data.chatId === selectedChat.id) {
                setMessages((prev: Message[]) => prev.map(msg => 
                    msg.id === data.messageId ? { 
                        ...msg, 
                        readBy: msg.readBy?.includes(data.userId) 
                            ? msg.readBy 
                            : [...(msg.readBy || []), data.userId] 
                    } : msg
                ));
            }

            setMessageCache((prevCache) => {
                const chatMessages = prevCache[data.chatId] || [];
                return {
                    ...prevCache,
                    [data.chatId]: chatMessages.map(msg => 
                        msg.id === data.messageId ? { 
                            ...msg, 
                            readBy: msg.readBy?.includes(data.userId) 
                                ? msg.readBy 
                                : [...(msg.readBy || []), data.userId] 
                        } : msg
                    )
                };
            });
        };

        const handleMessageReacted = (data: { messageId: string, userId: string, reaction: string }) => {
            if (selectedChat) {
                setMessages((prev: Message[]) => prev.map(msg => {
                    if (msg.id === data.messageId) {
                        const existingReactions = msg.reactions || [];
                        // Check if user already reacted with this emoji
                        const existingReactionIndex = existingReactions.findIndex(
                            r => r.userId === data.userId && r.emoji === data.reaction
                        );

                        let updatedReactions;
                        if (existingReactionIndex >= 0) {
                            // Remove existing reaction (toggle off)
                            updatedReactions = existingReactions.filter((_, index) => index !== existingReactionIndex);
                        } else {
                            // Remove any other reactions from this user for this message
                            const otherReactions = existingReactions.filter(r => r.userId !== data.userId);
                            // Add new reaction
                            updatedReactions = [...otherReactions, {
                                id: `${data.messageId}-${data.userId}-${Date.now()}`,
                                messageId: data.messageId,
                                userId: data.userId,
                                emoji: data.reaction,
                                reactedAt: new Date().toISOString()
                            }];
                        }

                        return { ...msg, reactions: updatedReactions };
                    }
                    return msg;
                }));

                // Update message cache
                setMessageCache((prevCache) => {
                    const chatMessages = prevCache[selectedChat.id] || [];
                    return {
                        ...prevCache,
                        [selectedChat.id]: chatMessages.map(msg => {
                            if (msg.id === data.messageId) {
                                const existingReactions = msg.reactions || [];
                                const existingReactionIndex = existingReactions.findIndex(
                                    r => r.userId === data.userId && r.emoji === data.reaction
                                );

                                let updatedReactions;
                                if (existingReactionIndex >= 0) {
                                    updatedReactions = existingReactions.filter((_, index) => index !== existingReactionIndex);
                                } else {
                                    const otherReactions = existingReactions.filter(r => r.userId !== data.userId);
                                    updatedReactions = [...otherReactions, {
                                        id: `${data.messageId}-${data.userId}-${Date.now()}`,
                                        messageId: data.messageId,
                                        userId: data.userId,
                                        emoji: data.reaction,
                                        reactedAt: new Date().toISOString()
                                    }];
                                }

                                return { ...msg, reactions: updatedReactions };
                            }
                            return msg;
                        })
                    };
                });
            }
        };

        socket.on("connect", handleConnect);
        socket.on("disconnect", handleDisconnect);
        socket.on("reconnect", handleReconnect);
        socket.on("userStatusChanged", handleUserStatusChanged);
        socket.on("newMessage", handleNewMessage);
        socket.on("startTyping", handleStartTyping);
        socket.on("stopTyping", handleStopTyping);
        socket.on("messageDeleted", handleMessageDeleted);
        socket.on("messageDelivered", handleMessageDelivered);
        socket.on("messageRead", handleMessageRead);
        socket.on("messageReacted", handleMessageReacted);
        socket.on("chat:readAll:notify", (data: { chatId: string, userId: string }) => {
            if (selectedChat && data.chatId === selectedChat.id) {
                // Update all messages in this chat as read by this user
                setMessages((prev: Message[]) => prev.map(msg => ({
                    ...msg,
                    readBy: msg.readBy ? 
                        msg.readBy.includes(data.userId) ? msg.readBy : [...msg.readBy, data.userId]
                        : [data.userId]
                })));

                // Update message cache
                setMessageCache((prevCache) => {
                    const chatMessages = prevCache[data.chatId] || [];
                    return {
                        ...prevCache,
                        [data.chatId]: chatMessages.map(msg => ({
                            ...msg,
                            readBy: msg.readBy ?
                                msg.readBy.includes(data.userId) ? msg.readBy : [...msg.readBy, data.userId]
                                : [data.userId]
                        }))
                    };
                });
            }
        });

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
            socket.off("messageDelivered", handleMessageDelivered);
            socket.off("messageRead", handleMessageRead);
            socket.off("messageReacted", handleMessageReacted);
            socket.off("chat:readAll:notify");
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
