import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

interface EmptyStateProps {
  onNewChat: () => void;
}

const EmptyState = ({ onNewChat }: EmptyStateProps) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-md mx-auto">
        <div className="relative mb-8">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-transparent backdrop-blur-sm border border-border/20 flex items-center justify-center mx-auto shadow-2xl">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/30 to-primary/20 flex items-center justify-center">
              <MessageSquare className="h-12 w-12 text-primary animate-pulse" />
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl"></div>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Welcome to ChatFlow
          </h2>
          <p className="text-muted-foreground leading-relaxed text-lg">
            Select a conversation from the sidebar to start messaging, or create a new chat to connect with someone.
          </p>
        </div>
        
        <div className="mt-8">
          <Button 
            onClick={onNewChat}
            className="auth-button group px-8 py-3 text-base font-medium"
          >
            <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-200" />
            Start New Chat
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmptyState; 