import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";

interface EmptyStateProps {
  onNewChat: () => void;
}

const EmptyState = ({ onNewChat }: EmptyStateProps) => {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto mb-6">
          <MessageSquare className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-foreground">
          Welcome to ChatFlow
        </h2>
        <p className="text-muted-foreground mb-6 leading-relaxed">
          Select a conversation from the sidebar to start messaging, or create a new chat to connect with someone.
        </p>
        <Button 
          onClick={onNewChat}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm px-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Start New Chat
        </Button>
      </div>
    </div>
  );
};

export default EmptyState; 