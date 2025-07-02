import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message, User, Chat } from "@/types/user";
import { 
  MoreVertical,
  Lock,
  Trash2,
} from "lucide-react";

interface MessageListProps {
  messages: Message[];
  currentUser: User | null;
  selectedChat: Chat;
  messagesLoading: boolean;
  typingText?: string;
  onDeleteMessage: (messageId: string, deleteForBoth: boolean) => void;
}

const MessageList = ({ 
  messages, 
  currentUser, 
  selectedChat, 
  messagesLoading, 
  typingText,
  onDeleteMessage 
}: MessageListProps) => {
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingText]);

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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background/20">
      {messagesLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
              <div className="max-w-[70%]">
                <Skeleton className={`h-16 w-48 rounded-2xl ${i % 2 === 0 ? "bg-muted/50" : "bg-primary/20"}`} />
              </div>
            </div>
          ))}
        </div>
      ) : messages.length > 0 ? (
        messages.map((msg, index) => {
          const isOwn = msg.senderId === currentUser?.id;
          const showSender = !isOwn && selectedChat.isGroup && 
            (index === 0 || messages[index - 1].senderId !== msg.senderId);
          
          return (
            <div
              key={msg.id}
              className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-2 group`}
            >
              <div className={`max-w-[70%] ${isOwn ? "order-2" : "order-1"} relative`}>
                {showSender && (
                  <div className="text-xs text-muted-foreground mb-1 px-4 font-medium">
                    {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : "Unknown"}
                  </div>
                )}
                <div className={`p-4 rounded-2xl shadow-sm transition-all duration-200 relative backdrop-blur-sm ${
                  isOwn 
                    ? "bg-primary text-primary-foreground ml-auto" 
                    : "bg-background/80 border border-border/50 text-foreground"
                }`}>
                  <p className="text-sm leading-relaxed">{msg.text}</p>
                  <div className={`text-xs mt-2 font-medium ${
                    isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                  }`}>
                                              {formatTime(msg.sentAt)}
                          </div>
                          
                          {isOwn && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute -right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-background/20 hover:bg-background/30 text-primary-foreground"
                      onClick={() => setShowMessageOptions(showMessageOptions === msg.id ? null : msg.id)}
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  )}
                  
                  {showMessageOptions === msg.id && (
                    <div className="absolute right-0 top-10 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-lg z-10 min-w-[160px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          onDeleteMessage(msg.id, false);
                          setShowMessageOptions(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete for me
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          onDeleteMessage(msg.id, true);
                          setShowMessageOptions(null);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete for everyone
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-foreground/80 font-medium mb-1">
            Start of conversation
          </p>
          <p className="text-sm text-muted-foreground">
            This is the beginning of your conversation with {selectedChat.name}
          </p>
        </div>
      )}
      
      {/* Typing indicator */}
      {typingText && (
        <div className="flex items-start gap-3 px-4 py-2">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center">
              <div className="text-xs font-medium text-muted-foreground">
                {selectedChat.name.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="bg-muted/50 rounded-2xl px-4 py-2 max-w-xs">
            <p className="text-sm text-muted-foreground italic">{typingText}</p>
          </div>
        </div>
      )}
       
      <div ref={messagesEndRef} />
    </div>
  );
};

export default MessageList; 