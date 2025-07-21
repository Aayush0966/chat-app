import { Button } from "@/components/ui/button";
import type { Chat } from "@/types/user";
import { 
  Phone, 
  Video, 
  MoreVertical,
  Menu,
  Circle,
  Users
} from "lucide-react";

interface ChatHeaderProps {
  selectedChat: Chat;
  onlineUsers?: Record<string, boolean>;
  onMobileMenuToggle: () => void;
}

const ChatHeader = ({ selectedChat, onlineUsers, onMobileMenuToggle }: ChatHeaderProps) => {
  const isOnline = !selectedChat.isGroup && selectedChat.userId && onlineUsers?.[selectedChat.userId];
  
  return (
    <div className="p-6 border-b border-border/20 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-sm shadow-sm">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 hover:bg-primary/10 text-foreground/70 hover:text-foreground rounded-xl"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary font-semibold shadow-lg border border-primary/20">
            {selectedChat.isGroup ? (
              <Users className="h-6 w-6" />
            ) : (
              selectedChat.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card shadow-sm animate-pulse"></div>
          )}
        </div>
        <div>
          <h2 className="font-bold text-foreground text-lg">{selectedChat.name}</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            {!selectedChat.isGroup && (
              <>
                <Circle className={`h-2 w-2 ${isOnline ? 'fill-green-500 text-green-500' : 'fill-gray-400 text-gray-400'}`} />
                {isOnline ? 'Active now' : 'Offline'}
              </>
            )}
            {selectedChat.isGroup && (
              <>
                <Users className="h-3 w-3" />
                Group chat
              </>
            )}
          </p>
        </div>
      </div>
      
      <div className="flex gap-1">
        <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 text-foreground/70 hover:text-foreground">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 text-foreground/70 hover:text-foreground">
          <Video className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 text-foreground/70 hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatHeader;