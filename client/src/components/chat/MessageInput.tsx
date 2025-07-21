import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/chat";
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
  onType: () => void;
  onSendImage?: (file: File) => Promise<void>; // Remove caption parameter
}

const MessageInput = ({ message, setMessage, onSend, onType, onSendImage }: MessageInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleImageUpload = async (file: File) => {
    if (onSendImage) {
      await onSendImage(file);
    }
  };

  return (
    <>
      <div className="p-6 border-t border-border/20 bg-gradient-to-r from-primary/5 to-transparent backdrop-blur-sm shadow-lg">
        <div className="flex items-end gap-4 max-w-none">
          <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all duration-200 shadow-sm hover:shadow-md">
            <Paperclip className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-12 w-12 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            onClick={() => setShowImageUpload(true)}
          >
            <Image className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <div className="auth-input-container min-h-[52px] py-4">
              <Input
                ref={inputRef}
                placeholder="Type your message..."
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  onType();
                }}
                onKeyDown={handleKeyDown}
                className="auth-input flex-1"
              />
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                >
                  <Smile className="h-4 w-4" />
                </Button>
                {!message.trim() && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
          
          {message.trim() && (
            <Button 
              onClick={onSend} 
              className="h-12 w-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground p-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </div>
      </div>

      <ImageUpload
        isOpen={showImageUpload}
        onClose={() => setShowImageUpload(false)}
        onSend={handleImageUpload}
      />
    </>
  );
};

export default MessageInput; 