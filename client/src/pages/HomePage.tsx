import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { searchUsers } from "@/services/api";
import type { User } from "@/types/user";

const HomePage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User>();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      navigate("/login");
    }
  }, []);

  useEffect(() => {
    if (!query) {
      setUsers([]);
      return;
    }
    const fetchUsers = async () => {
      try {
        const res = await searchUsers(query);
        setUsers(res.data || []);
      } catch {
        setUsers([]);
      }
    };
    fetchUsers();
  }, [query]);

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
            <div className="font-semibold text-lg">User</div>
            <div className="text-xs">Online</div>
          </div>
        </div>
        <Input
          className="w-full px-4 py-2 border "
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div
          className="h-full overflow-y-scroll"
          style={{ scrollbarWidth: "none" }}
        >
          {users.map((user) => (
            <div
              key={user.id}
              className={`flex items-center gap-4 p-3 rounded-2xl cursor-pointer hover:bg-[#888888]/10 transition group relative ${selectedUser?.id === user.id ? "bg-[#888888]/10" : ""}`}
              onClick={() => setSelectedUser(user)}
            >
              <img
                src="https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg"
                alt=""
                className="w-12 h-12 rounded-full border"
              />
              <div className="flex-1">
                <div className="font-semibold">{user.firstName}</div>
                <div className="text-xs">{user.lastName}</div>
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
        {!selectedUser ? (
          <div className="flex flex-col items-center justify-center h-full">
            <img
              src="https://i.pinimg.com/originals/92/ae/c4/92aec4767fde211d4b435e0d0518b3a6.jpg"
              alt="random"
              className="w-32 h-32 rounded-full border mb-6"
            />
            <div className="text-lg text-muted-foreground">
              Select a user to view details and messages
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
                <div className="font-semibold text-lg">
                  {selectedUser.firstName} {selectedUser.lastName}
                </div>
                <div className="text-xs">last seen 2m ago</div>
              </div>
            </div>
            <div
              className="h-full overflow-y-scroll flex flex-col gap-4 mt-6"
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
            <div className="flex items-center gap-4 mt-4">
              <Input
                className="px-4 py-2 border"
                placeholder="Type a message..."
              />
              <Button className="">Send</Button>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default HomePage;
