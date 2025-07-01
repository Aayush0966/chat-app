import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChatsByUser, sendMessage } from "@/services/api";
import type { Chat, Message } from "@/types/user";

const HomePage = () => {
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await getChatsByUser();
        setChats(res.data || []);
        if (res.data && res.data.length > 0) setSelectedChat(res.data[0]);
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          navigate("/auth/login");
        } else {
          setChats([]);
        }
      }
    };
    fetchChats();
  }, [navigate]);

  const handleSend = async () => {
    if (!message.trim() || !selectedChat) return;
    try {
      const res = await sendMessage({
        chatId: selectedChat.id,
        text: message,
        messageType: "TEXT",
      });
      if (res?.data) {
        setMessages((prev) => [...prev, res.data]);
        setMessage("");
      }
    } catch (err) {}
  };

  return (
    <div className="w-full flex justify-center lg:bg-background rounded-xl shadow-2xl text-primary">
      <aside className="w-1/3 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <img
            className="rounded-full w-16 h-16"
            src="https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg"
            alt=""
          />
          <div>
            <div className="font-semibold text-lg">User</div>
            <div className="text-xs">Online</div>
          </div>
        </div>
        <div
          className="h-full overflow-y-scroll"
          style={{ scrollbarWidth: "none" }}
        >
          {chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-[#888888]/10 transition group relative ${
                selectedChat?.id === chat.id ? "bg-[#888888]/10" : ""
              }`}
              onClick={() => setSelectedChat(chat)}
            >
              <img
                src="https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg"
                alt=""
                className="w-12 h-12 rounded-full border"
              />
              <div className="flex-1">
                <div className="font-semibold">{chat.name}</div>
                <div className="text-xs text-muted-foreground truncate">
                  {chat.lastMessage || "No messages yet"}
                </div>
              </div>
              {chat.lastMessageTime && (
                <span className="text-xs text-muted-foreground">
                  {new Date(chat.lastMessageTime).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>
          ))}
        </div>
        <Button
          onClick={() => {
            navigate("/auth/login");
          }}
          className="auth-button"
        >
          Logout
        </Button>
      </aside>
      <main className="flex-1 flex flex-col gap-4 p-8 relative">
        {!selectedChat ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src="https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg"
              alt="random"
              className="w-32 h-32 rounded-full border mb-6"
            />
            <div className="text-lg text-muted-foreground">
              Select a chat to view details and messages
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <img
                src="https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg"
                alt=""
                className="w-10 h-10 rounded-full border"
              />
              <div>
                <div className="font-semibold text-lg">{selectedChat.name}</div>
                <div className="text-xs">
                  {selectedChat.isGroup ? "Group" : "Direct"}
                </div>
              </div>
            </div>
            <div
              className="h-full overflow-y-scroll flex flex-col gap-4 mt-6"
              style={{ scrollbarWidth: "none" }}
            >
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className="self-start max-w-[70%] bg-black/10 rounded-xl px-4 py-2"
                  >
                    {msg.text}
                  </div>
                ))
              ) : selectedChat.lastMessage ? (
                <div className="self-start max-w-[70%] bg-black/10 rounded-xl px-4 py-2">
                  {selectedChat.lastMessage}
                </div>
              ) : (
                <div className="text-muted-foreground">No messages yet</div>
              )}
            </div>
            <div className="flex items-center gap-4 mt-4">
              <Input
                className="px-4 py-2 border"
                placeholder="Type a message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <Button className="" onClick={handleSend}>
                Send
              </Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default HomePage;
