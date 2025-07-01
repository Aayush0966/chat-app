import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { User } from "@/types/user";
import { 
  Search, 
  ArrowLeft,
  MessageSquare,
  Plus
} from "lucide-react";

interface NewChatModalProps {
  userSearchQuery: string;
  setUserSearchQuery: (query: string) => void;
  searchedUsers: User[];
  onUserSearch: (query: string) => void;
  onCreateChat: (userId: string, userName: string) => void;
  onClose: () => void;
}

const NewChatModal = ({
  userSearchQuery,
  setUserSearchQuery,
  searchedUsers,
  onUserSearch,
  onCreateChat,
  onClose
}: NewChatModalProps) => {
  const handleUserSearch = useCallback((query: string) => {
    setUserSearchQuery(query);
    onUserSearch(query);
  }, [setUserSearchQuery, onUserSearch]);

  return (
    <div className="h-full max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-8rem)] flex flex-col bg-background/60 backdrop-blur-sm">
      <div className="flex items-center gap-4 p-6 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-10 w-10 hover:bg-primary/10 text-foreground/70 hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
            <MessageSquare className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              New Chat
            </h1>
            <p className="text-sm text-muted-foreground">
              Find someone to start a conversation
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-6 bg-background/60 backdrop-blur-sm border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search people by name..."
            value={userSearchQuery}
            onChange={(e) => handleUserSearch(e.target.value)}
            className="pl-12 h-12 bg-background/80 border-border/50 focus:border-primary/50 text-foreground placeholder-muted-foreground rounded-xl"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-background/30">
        <div className="p-4">
          {userSearchQuery && searchedUsers.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-foreground/80 font-medium">No users found</p>
              <p className="text-sm text-muted-foreground mt-1">Try searching with different keywords</p>
            </div>
          ) : (
            <div className="space-y-2">
              {searchedUsers.map((user) => (
                <div
                  key={user.id}
                  className="group flex items-center gap-4 p-4 rounded-xl bg-background/80 hover:bg-background/90 cursor-pointer transition-all duration-200 border border-border/30 hover:border-primary/30 hover:shadow-sm backdrop-blur-sm"
                  onClick={() => onCreateChat(user.id, `${user.firstName} ${user.lastName}`)}
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-primary-foreground font-medium text-lg shadow-sm">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-background" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {user.firstName} {user.lastName}
                    </div>
                    <div className="text-sm text-muted-foreground">Click to start chatting</div>
                  </div>
                  <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal; 