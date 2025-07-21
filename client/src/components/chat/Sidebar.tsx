import { useState, useEffect, useRef } from "react";
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
  Trash2,
  Settings,
  Moon,
} from "lucide-react";

interface SidebarProps {
  chats: Chat[];
  selectedChat: Chat | null;
  currentUser: User | null;
  loading: boolean;
  searchQuery: string;
  onlineUsers?: Record<string, boolean>;
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
  onlineUsers = {},
  setSearchQuery,
  onChatSelect,
  onNewChat,
  onLogout,
  onDeleteChat,
  onClose,
  isOpen
}: SidebarProps) => {
  const [showChatOptions, setShowChatOptions] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setShowChatOptions(null);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2).toUpperCase();
  };

  const clearSearch = () => {
    setSearchQuery('');
  };


  chats.map((ch) => {
    console.log(ch.lastMessageType)
  })

  return (
    <div className={`w-80 flex flex-col z-50 bg-card/95 backdrop-blur-sm border-r border-border/20 md:relative absolute inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-all duration-300 ease-in-out shadow-2xl m-2 mr-0 rounded-l-xl overflow-hidden`}>
      {/* Header Section */}
      <div className="p-6 border-b border-border/20 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-lg border border-primary/20">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground gradient-text">
                ChatFlow
              </h1>
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Circle className="h-2 w-2 fill-green-500 text-green-500 animate-pulse" />
                <span className="font-medium">
                  {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : 'Online'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-all duration-200 rounded-xl"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onNewChat}
              className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-all duration-200 text-muted-foreground rounded-xl hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4" />
            </Button>
            
            {/* Profile Menu */}
            <div className="relative" ref={profileRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="h-9 w-9 hover:bg-muted/50 transition-all duration-200 text-muted-foreground rounded-xl"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
              
              {showProfileMenu && (
                <div className="absolute right-0 top-12 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl z-20 min-w-[160px] animate-in slide-in-from-top-2 duration-200">
                  <div className="p-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
                    >
                      <Moon className="h-4 w-4 mr-3" />
                      Dark Mode
                    </Button>
                    <div className="my-1 h-px bg-border/50" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onLogout}
                      className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Enhanced Search */}
        <div className={`relative transition-all duration-200 ${isSearchFocused ? 'scale-[1.02]' : ''}`}>
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="pl-10 pr-10 bg-background/70 border-border/50 focus:border-primary/50 text-foreground placeholder-muted-foreground transition-all duration-200 rounded-xl h-11"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 hover:bg-muted/50 rounded-lg"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
      
      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-muted/30 scrollbar-track-transparent">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-background/40 rounded-xl backdrop-blur-sm animate-pulse">
                <Skeleton className="w-12 h-12 rounded-full bg-muted/30" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-24 bg-muted/30" />
                  <Skeleton className="h-3 w-32 bg-muted/30" />
                </div>
                <Skeleton className="h-3 w-8 bg-muted/30" />
              </div>
            ))}
          </div>
        ) : filteredChats.length > 0 ? (
          <div className="p-3 space-y-1">
            {filteredChats.map((chat, index) => (
              <div
                key={chat.id}
                className={`group flex items-center p-3 hover:bg-background/80 cursor-pointer transition-all duration-200 rounded-xl border backdrop-blur-sm relative animate-in slide-in-from-left-4 ${
                  selectedChat?.id === chat.id 
                    ? "bg-primary/15 border-primary/40 shadow-sm ring-1 ring-primary/20" 
                    : "bg-background/40 border-border/20 hover:border-border/40 hover:shadow-sm"
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className="flex items-center gap-3 flex-1 min-w-0"
                  onClick={() => onChatSelect(chat)}
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br flex items-center justify-center text-foreground font-semibold shadow-sm ring-2 ring-background transition-all duration-200 ${
                      chat.isGroup 
                        ? "from-blue-500/20 to-blue-600/20 text-blue-600" 
                        : "from-muted to-muted/60"
                    }`}>
                      {chat.isGroup ? (
                        <Users className="h-6 w-6 text-blue-600" />
                      ) : (
                        getInitials(chat.name)
                      )}
                    </div>
                    {!chat.isGroup && onlineUsers[chat.userId!] && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {chat.isGroup ? chat.name : chat.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage ? chat.lastMessage : "No messages yet"}
                    </div>
                  </div>
                  <div className="ml-2 text-xs text-muted-foreground">
                    {chat.lastMessageTime ? formatTime(chat.lastMessageTime) : ""}
                  </div>
                </div>
                
                {/* Online Status */}
                {onlineUsers[chat.id] && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background shadow-sm" />
                )}
                
                {/* Chat Options */}
                <div className="relative flex-shrink-0" ref={optionsRef}>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-background/80 rounded-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowChatOptions(showChatOptions === chat.id ? null : chat.id);
                    }}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  
                  {showChatOptions === chat.id && (
                    <div className="absolute right-0 top-10 bg-background/95 backdrop-blur-md border border-border/50 rounded-xl shadow-xl z-10 min-w-[140px] animate-in slide-in-from-top-2 duration-200">
                      <div className="p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={() => {
                            onDeleteChat(chat.id);
                            setShowChatOptions(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-3" />
                          Delete Chat
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center animate-in fade-in-50 duration-500">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 flex items-center justify-center mx-auto mb-6 ring-1 ring-border/20">
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-foreground font-semibold mb-2 text-lg">
              {searchQuery ? "No chats found" : "No conversations yet"}
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              {searchQuery ? "Try searching with different keywords" : "Start your first conversation and connect with others"}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onNewChat}
              className="text-primary border-primary/40 hover:bg-primary/10 transition-all duration-200 rounded-xl hover:scale-105 active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              {searchQuery ? "Start New Chat" : "New Conversation"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;