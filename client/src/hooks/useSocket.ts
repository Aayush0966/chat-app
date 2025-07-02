import { useEffect, useState } from "react";
import socket from "@/services/socket";
import type { Message, Chat, TypingData } from "@/types/user";

interface UseSocketProps {
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    setMessageCache: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>;
    selectedChat: Chat | null;
}

export const useSocket = ({ setMessages, setChats, setMessageCache, selectedChat }: UseSocketProps) => {
    const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

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

                // Move the updated chat to the top of the list
                const updatedChatIndex = updatedChats.findIndex(chat => chat.id === data.message.chatId);
                if (updatedChatIndex > 0) {
                    const updatedChat = updatedChats[updatedChatIndex];
                    const otherChats = updatedChats.filter((_, index) => index !== updatedChatIndex);
                    return [updatedChat, ...otherChats];
                }

                return updatedChats;
            });
        };        const handleStartTyping = (data: TypingData) => {
            if (selectedChat && data.chatId === selectedChat.id) {
                setTypingUsers(prev => ({
                    ...prev,
                    [data.typingUserId]: data.typingUserName
                }));
            }
        }

        const handleStopTyping = (data: TypingData) => {
            if (selectedChat && data.chatId === selectedChat.id) {
                setTypingUsers(prev => {
                    const updated = { ...prev };
                    delete updated[data.typingUserId];
                    return updated;
                });
            }
        }

        const handleConnect = () => {
            console.log("🔌 Socket connected");
            socket.emit("ping", "Ping from client");
        };

        const handlePong = (data: string) => {
            console.log("🏓 Pong from server:", data);
        };

        const handleConnectError = (error: Error) => {
            console.error("❌ Socket connection error:", error.message);
        };

        socket.on("connect", handleConnect);
        socket.on("startTyping", handleStartTyping)
        socket.on("stopTyping", handleStopTyping)
        socket.on("newMessage", handleNewMessage);
        socket.on("pong", handlePong);
        socket.on("connect_error", handleConnectError);

        if (socket.connected) {
            socket.emit("ping", "Ping from client");
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("startTyping", handleStartTyping);
            socket.off("stopTyping", handleStopTyping);
            socket.off("newMessage", handleNewMessage);
            socket.off("pong", handlePong);
            socket.off("connect_error", handleConnectError);
        };
    }, [setMessages, setChats, setMessageCache, selectedChat]);

    // Get typing indicator text
    const typingUsersArray = Object.values(typingUsers);
    const typingText = typingUsersArray.length > 0 
        ? `${typingUsersArray.join(', ')} ${typingUsersArray.length === 1 ? 'is' : 'are'} typing...`
        : '';

    return { socket, typingText };
};
