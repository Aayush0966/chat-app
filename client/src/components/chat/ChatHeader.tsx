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
    <div className="p-4 border-b border-border/50 flex items-center justify-between bg-background/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden h-10 w-10 hover:bg-primary/10 text-foreground/70 hover:text-foreground"
          onClick={onMobileMenuToggle}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center text-foreground font-medium shadow-sm">
            {selectedChat.isGroup ? (
              <Users className="h-5 w-5" />
            ) : (
              selectedChat.name.split(' ').map(n => n.charAt(0)).join('').substring(0, 2)
            )}
          </div>
          {isOnline && (
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
          )}
        </div>
        <div>
          <h2 className="font-semibold text-foreground">{selectedChat.name}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
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