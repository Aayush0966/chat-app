import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Send, 
  Smile,
  Paperclip,
  Image,
  Mic
} from "lucide-react";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => void;
}

const MessageInput = ({ message, setMessage, onSend }: MessageInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-border/50 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 text-muted-foreground hover:text-foreground">
          <Paperclip className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/10 text-muted-foreground hover:text-foreground">
          <Image className="h-4 w-4" />
        </Button>
        
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="bg-background/60 border-border/50 focus:border-primary/50 pr-20 py-3 text-foreground placeholder-muted-foreground rounded-xl"
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
            >
              <Smile className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary/10 text-muted-foreground hover:text-foreground"
            >
              <Mic className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={onSend} 
          disabled={!message.trim()}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-6 h-12 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput; 