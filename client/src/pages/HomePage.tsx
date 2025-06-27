import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const chats = [
  {
    id: 1,
    name: "Alice",
    lastMessage: "See you at 8!",
    time: "10:45 AM",
    unread: 2,
    avatar:
      "https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg",
  },
  {
    id: 2,
    name: "Bob",
    lastMessage: "Let's catch up soon.",
    time: "09:30 AM",
    unread: 0,
    avatar:
      "https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg",
  },
  {
    id: 3,
    name: "Charlie",
    lastMessage: "Sent the files.",
    time: "Yesterday",
    unread: 1,
    avatar:
      "https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg",
  },
];

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      navigate("/login");
      return;
    }
  }, [navigate]);

  return (
    <div className="w-full flex justify-center lg:bg-background rounded-xl shadow-2xl">
      <aside className="w-1/3 p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <img
            className="rounded-full w-16 h-16"
            src="https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg"
            alt=""
          />
          <div>
            <div className="font-semibold text-lg">Username</div>
            <div className="text-xs">Online</div>
          </div>
        </div>
        <Input
          className="w-full px-4 py-2 border "
          placeholder="Search chats..."
        />
        <div
          className="h-full overflow-y-scroll"
          style={{ scrollbarWidth: "none" }}
        >
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-[#888888]/10 transition group relative"
            >
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-12 h-12 rounded-full border"
              />
              <div className="flex-1">
                <div className="font-semibold">{chat.name}</div>
                <div className="text-xs">{chat.lastMessage}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-xs">{chat.time}</span>
                {chat.unread > 0 && (
                  <span className="bg-[#888888] text-white text-xs rounded-full px-2 py-0.5 font-bold">
                    {chat.unread}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        <Button
          onClick={() => {
            localStorage.removeItem("accessToken");
            navigate("/login");
          }}
          className="auth-button"
        >
          Logout
        </Button>
      </aside>
      <main className="flex-1 flex flex-col gap-4 p-8 relative">
        <div className="flex items-center gap-4">
          <img
            src={chats[0].avatar}
            alt={chats[0].name}
            className="w-10 h-10 rounded-full border"
          />
          <div>
            <div className="font-semibold text-lg">{chats[0].name}</div>
            <div className="text-xs">last seen 2m ago</div>
          </div>
        </div>

        <div
          className="h-full overflow-y-scroll flex flex-col gap-4"
          style={{ scrollbarWidth: "none" }}
        >
          <div className="self-start max-w-[70%] bg-black/10 rounded-xl px-4 py-2">
            Hey! Are we still on for tonight?
          </div>
          <div className="self-end max-w-[70%] bg-black/10 rounded-xl px-4 py-2">
            Yes! See you at 8!
          </div>
          <div className="self-start max-w-[70%] bg-black/10 rounded-xl px-4 py-2">
            Awesome, can't wait!
          </div>
          <div className="self-end max-w-[70%] bg-black/10 rounded-xl px-4 py-2">
            😁
          </div>
          <div className="self-end max-w-[70%] bg-black/10 rounded-xl px-4 py-2">
            😁
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Input className="px-4 py-2 border" placeholder="Type a message..." />
          <Button className="">Send</Button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
