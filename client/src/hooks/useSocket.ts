import { useEffect } from "react";
import socket from "@/services/socket";
import type { Message, Chat } from "@/types/user";

interface UseSocketProps {
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
}

export const useSocket = ({ setMessages, setChats }: UseSocketProps) => {
    useEffect(() => {
        if (!socket.connected) {
            socket.connect();
        }

        const handleNewMessage = (data: { message: Message }) => {
            console.log("📩 New message received:", data);

            setMessages((prev: Message[]) => {
                if (prev.some((msg) => msg.id === data.message.id)) return prev;
                return [...prev, data.message];
            });

            // Update the chat's lastMessage and lastMessageTime
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
        };

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
        socket.on("newMessage", handleNewMessage);
        socket.on("pong", handlePong);
        socket.on("connect_error", handleConnectError);

        if (socket.connected) {
            socket.emit("ping", "Ping from client");
        }

        return () => {
            socket.off("connect", handleConnect);
            socket.off("newMessage", handleNewMessage);
            socket.off("pong", handlePong);
            socket.off("connect_error", handleConnectError);
        };
    }, [setMessages, setChats]);

    return socket;
};
