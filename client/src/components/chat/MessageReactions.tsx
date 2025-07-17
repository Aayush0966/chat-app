import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MessageReaction } from "@/types/user";

interface MessageReactionsProps {
  reactions: MessageReaction[];
  onReact: (emoji: string) => void;
  currentUserId: string;
  isOwn: boolean;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "😡"];

const MessageReactions = ({ reactions, onReact, currentUserId, isOwn }: MessageReactionsProps) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  // Group reactions by emoji
  const groupedReactions = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = [];
    }
    acc[reaction.emoji].push(reaction);
    return acc;
  }, {} as Record<string, MessageReaction[]>);

  const hasUserReacted = (emoji: string) => {
    return groupedReactions[emoji]?.some(r => r.userId === currentUserId) || false;
  };

  const handleEmojiClick = (emoji: string) => {
    onReact(emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex items-center gap-1 mt-1 relative">
      {/* Existing Reactions */}
      {Object.entries(groupedReactions).map(([emoji, emojiReactions]) => (
        <Button
          key={emoji}
          variant="ghost"
          size="sm"
          className={`h-6 px-2 py-1 text-xs rounded-full transition-all duration-200 ${
            hasUserReacted(emoji)
              ? "bg-primary/20 border border-primary/40 text-primary"
              : "bg-muted/50 hover:bg-muted/70 text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => handleEmojiClick(emoji)}
        >
          <span className="mr-1">{emoji}</span>
          <span className="text-xs font-medium">{emojiReactions.length}</span>
        </Button>
      ))}

      {/* Add Reaction Button */}
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          className={`h-6 w-6 p-0 rounded-full text-xs transition-all duration-200 ${
            isOwn 
              ? "text-white/70 hover:text-white hover:bg-white/20" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          }`}
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
        >
          <span>😊</span>
        </Button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-8 left-0 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl z-20 p-2 flex gap-1 animate-in slide-in-from-bottom-2 duration-200">
            {COMMON_EMOJIS.map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-primary/10 transition-colors"
                onClick={() => handleEmojiClick(emoji)}
              >
                <span className="text-lg">{emoji}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Click outside to close picker */}
      {showEmojiPicker && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setShowEmojiPicker(false)}
        />
      )}
    </div>
  );
};

export default MessageReactions;
