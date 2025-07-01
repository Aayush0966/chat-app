import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { Chat, User } from "@/types/user";
import { 
  Search, 
  Plus, 
  LogOut, 
  MessageSquare,
  X,
  Circle,
  Users,
  MoreVertical,
  Trash2
} from "lucide-react";

interface SidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  currentUser: User | null;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onChatSelect: (chat: Chat) => void;
  onNewChat: () => void;
  onLogout: () => void;
  onDeleteChat: (chatId: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

const Sidebar = ({
  chats,
  selectedChat,
  currentUser,
  loading,
  searchQuery,
  setSearchQuery,
  onChatSelect,
  onNewChat,
  onLogout,
  onDeleteChat,
  onClose,
  isOpen
}: SidebarProps) => {
  const [showChatOptions, setShowChatOptions] = useState<string | null>(null);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffInHours < 168) {
      return date.toLocaleDateString([], { weekday: "short" });
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" });
    }
  };

  return (
    <div className={`w-80 flex flex-col z-50 bg-background/80 backdrop-blur-xl border-r border-border/50 md:relative absolute inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out shadow-lg md:shadow-none`}>
      <div className="p-6 border-b border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                ChatFlow
              </h1>
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Online'}
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors text-muted-foreground"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
                  </div>
          
          <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background/60 border-border/50 focus:border-primary/50 text-foreground placeholder-muted-foreground"
          />
        </div>
              </div>
        
        <div className="flex-1 overflow-y-auto bg-background/30">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-background/60 rounded-lg backdrop-blur-sm">
                <Skeleton className="w-12 h-12 rounded-full bg-muted/50" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-2 bg-muted/50" />
                  <Skeleton className="h-3 w-32 bg-muted/50" />
                </div>
                <Skeleton className="h-3 w-8 bg-muted/50" />
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="p-4">
            {filteredChats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center gap-3 p-4 hover:bg-background/80 cursor-pointer transition-all duration-200 rounded-xl mb-2 border backdrop-blur-sm relative ${
                  selectedChat?.id === chat.id 
                    ? "bg-primary/10 border-primary/30 shadow-sm" 
                    : "bg-background/60 border-border/30 hover:border-border/50"
                }`}
              >
                <div
                  className="flex items-center gap-3 flex-1"
                  onClick={() => onChatSelect(chat)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center text-foreground font-medium shadow-sm">
                      {chat.isGroup ? (
                        <Users className="h-6 w-6" />
                      ) : (
                        chat.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)
                      )}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`font-semibold truncate transition-colors ${
                        selectedChat?.id === chat.id 
                          ? "text-primary" 
                          : "text-foreground group-hover:text-foreground/80"
                      }`}>
                        {chat.name}
                      </h3>
                      {chat.lastMessageTime && (
                        <span className="text-xs text-muted-foreground font-medium">
                          {formatTime(chat.lastMessageTime)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {chat.lastMessage || "No messages yet"}
                    </p>
                  </div>
                                  </div>
                  
                  <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground hover:bg-background/80"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChatOptions(showChatOptions === chat.id ? null : chat.id);
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  
                  {showChatOptions === chat.id && (
                    <div className="absolute right-0 top-10 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg z-10 min-w-[120px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          onDeleteChat(chat.id);
                          setShowChatOptions(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Chat
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-foreground/80 font-medium mb-1">
              {searchQuery ? "No chats found" : "No conversations yet"}
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? "Try searching with different keywords" : "Start your first conversation"}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNewChat}
              className="text-primary border-primary/30 hover:bg-primary/10"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar; 