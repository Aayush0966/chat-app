import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageLightbox, MessageReactions } from "@/components/chat";
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
  loadingOlderMessages: boolean;
  hasMoreMessages: boolean;
  typingText?: string;
  onDeleteMessage: (messageId: string, deleteForBoth: boolean) => void;
  onReactToMessage: (messageId: string, emoji: string) => void;
  onLoadOlderMessages: () => void;
  socket?: { emit: (event: string, ...args: unknown[]) => void }; // Add socket prop for emitting read events
}

const MessageList = ({ 
  messages, 
  currentUser, 
  selectedChat, 
  messagesLoading, 
  loadingOlderMessages,
  hasMoreMessages,
  typingText,
  onDeleteMessage,
  onReactToMessage,
  onLoadOlderMessages,
  socket
}: MessageListProps) => {
  const [showMessageOptions, setShowMessageOptions] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<{src: string, alt: string} | null>(null);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
  const [readMessages, setReadMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: smooth ? "smooth" : "auto" 
    });
  };

  // Handle image load events
  const handleImageLoad = useCallback(() => {
    // Scroll to bottom when images load to maintain position
    if (hasInitiallyScrolled) {
      scrollToBottom();
    }
  }, [hasInitiallyScrolled]);

  // Enhanced scroll function that waits for images
  const scrollToBottomWithImageWait = useCallback((smooth = true) => {
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Initial scroll
    scrollToBottom(smooth);

    // Set up additional scrolls to handle image loading
    const scrollDelays = [100, 300, 600, 1000]; // Progressive delays
    
    scrollDelays.forEach(delay => {
      scrollTimeoutRef.current = setTimeout(() => {
        scrollToBottom(false);
      }, delay);
    });
  }, []);

  // Reset scroll state when chat changes
  useEffect(() => {
    setHasInitiallyScrolled(false);
  }, [selectedChat.id]);

  // Enhanced scroll to bottom effect for initial load and chat changes
  useEffect(() => {
    if (!messagesLoading && messages.length > 0 && !hasInitiallyScrolled) {
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        setTimeout(() => {
          scrollToBottomWithImageWait(false);
          setHasInitiallyScrolled(true);
        }, 0);
      });
    }
  }, [messagesLoading, messages.length, hasInitiallyScrolled, selectedChat.id, scrollToBottomWithImageWait]);

  // Smooth scroll for new messages after initial load
  useEffect(() => {
    if (hasInitiallyScrolled && !messagesLoading) {
      scrollToBottom();
    }
  }, [messages, typingText, hasInitiallyScrolled, messagesLoading]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Intersection Observer to mark messages as read when they come into view
  useEffect(() => {
    if (!currentUser?.id || !socket || messages.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.getAttribute('data-message-id');
            const senderId = entry.target.getAttribute('data-sender-id');
            
            // Only mark as read if:
            // 1. Message ID exists
            // 2. Message is not sent by current user (don't read own messages)
            // 3. Message hasn't been read before
            if (messageId && senderId !== currentUser.id && !readMessages.has(messageId)) {
              console.log('🔍 Marking message as read:', messageId);
              setReadMessages(prev => new Set(prev).add(messageId));
              
              // Emit read event to server
              socket.emit("message:read", messageId, selectedChat.id, (response: { success: boolean }) => {
                if (response?.success) {
                  console.log('✅ Message marked as read successfully:', messageId);
                } else {
                  console.error('❌ Failed to mark message as read:', messageId);
                }
              });
            }
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '-20px 0px', // Only trigger when message is 20px into view
        threshold: 0.3 // 30% of message must be visible
      }
    );

    // Add a small delay to ensure DOM elements are ready
    const timeoutId = setTimeout(() => {
      messageRefs.current.forEach((element, messageId) => {
        if (element) {
          observer.observe(element);
          console.log('👀 Observing message:', messageId);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [currentUser?.id, socket, selectedChat.id, readMessages, messages.length]);

  // Reset read messages when chat changes
  useEffect(() => {
    setReadMessages(new Set());
  }, [selectedChat.id]);

  // Handle scroll event for loading older messages
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop } = e.currentTarget;
    
    // If user scrolled to near the top (within 100px) and there are more messages
    if (scrollTop < 100 && hasMoreMessages && !loadingOlderMessages && !messagesLoading) {
      onLoadOlderMessages();
    }
  }, [hasMoreMessages, loadingOlderMessages, messagesLoading, onLoadOlderMessages]);

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
    <div 
      ref={containerRef}
      className="flex-1 overflow-y-auto bg-gradient-to-b from-background/50 to-muted/10 scrollbar-hide"
      onScroll={handleScroll}
    >
      <div className="min-h-full flex flex-col justify-end p-6 space-y-4">
        {/* Loading indicator for older messages */}
        {loadingOlderMessages && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
        
        {messagesLoading ? (
        <div className="space-y-6">
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
              className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4 group animate-in fade-in-0 slide-in-from-bottom-2 duration-300`}
              data-message-id={msg.id}
              data-sender-id={msg.senderId}
              ref={(el) => {
                if (el) {
                  messageRefs.current.set(msg.id, el);
                } else {
                  messageRefs.current.delete(msg.id);
                }
              }}
            >
              <div className={`max-w-[75%] ${isOwn ? "order-2" : "order-1"} relative`}>
                {showSender && (
                  <div className="text-xs text-primary font-semibold mb-2 px-4">
                    {msg.sender ? `${msg.sender.firstName} ${msg.sender.lastName}` : "Unknown"}
                  </div>
                )}
                <div 
                  className={`px-4 py-3 rounded-2xl transition-all duration-200 relative group/message shadow-lg hover:shadow-xl ${
                    isOwn 
                      ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground ml-auto shadow-primary/20 hover:shadow-primary/30" 
                      : "bg-card/95 backdrop-blur-sm border border-border/30 text-foreground hover:border-border/50"
                  }`}
                  style={{
                    borderRadius: isOwn 
                      ? "20px 20px 6px 20px"
                      : "20px 20px 20px 6px"
                  }}
                >
                  {msg.type === "ATTACHMENT" && msg.attachment ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <img
                          src={msg.attachment}
                          alt="Shared image"
                          className={`rounded-xl max-w-full h-auto max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity ${
                            msg.isUploading ? 'opacity-70' : ''
                          }`}
                          onClick={() => !msg.isUploading && setLightboxImage({src: msg.attachment!, alt: "Shared image"})}
                          onLoad={handleImageLoad}
                          loading="lazy"
                        />
                        {msg.isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl">
                            <div className="bg-card/95 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg border border-border/50">
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                              <span className="text-sm font-medium text-foreground">Uploading...</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className={`text-sm leading-relaxed ${
                      isOwn ? 'text-primary-foreground' : 'text-foreground'
                    }`}>
                      {msg.text}
                    </p>
                  )}
                  
                  {/* Time and Status Row */}
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <span className={`text-xs font-medium ${
                      isOwn ? "text-primary-foreground/70" : "text-muted-foreground"
                    }`}>
                      {formatTime(msg.sentAt)}
                    </span>
                    {isOwn && (
                      <div className="flex items-center gap-1">
                        {msg.readBy && msg.readBy.length > 0 ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-primary-foreground/70">✓✓</span>
                          </div>
                        ) : msg.delivered ? (
                          <span className="text-xs text-primary-foreground/70">✓</span>
                        ) : (
                          <span className="text-xs text-primary-foreground/50">⏱</span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Message Reactions */}
                  <MessageReactions
                    reactions={msg.reactions || []}
                    onReact={(emoji) => onReactToMessage(msg.id, emoji)}
                    currentUserId={currentUser?.id || ''}
                    isOwn={isOwn}
                  />
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute -right-2 top-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full ${
                      isOwn 
                        ? 'bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground/70' 
                        : 'bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                    onClick={() => setShowMessageOptions(showMessageOptions === msg.id ? null : msg.id)}
                  >
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                  
                  {showMessageOptions === msg.id && (
                    <>
                      <div className="fixed inset-0 z-[9998]" onClick={() => setShowMessageOptions(null)} />
                      <div className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-8 bg-card/95 backdrop-blur-sm border border-border/30 rounded-xl shadow-2xl z-[9999] min-w-[160px] py-2 animate-in slide-in-from-top-2 duration-200`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 text-sm rounded-lg mx-1"
                          onClick={() => {
                            onDeleteMessage(msg.id, false);
                            setShowMessageOptions(null);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-3" />
                          Delete for me
                        </Button>
                        {isOwn && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 text-sm rounded-lg mx-1"
                            onClick={() => {
                              onDeleteMessage(msg.id, true);
                              setShowMessageOptions(null);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-3" />
                            Delete for everyone
                          </Button>
                        )}
                      </div>
                    </>
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
      
      {lightboxImage && (
        <ImageLightbox
          src={lightboxImage.src}
          alt={lightboxImage.alt}
          isOpen={!!lightboxImage}
          onClose={() => setLightboxImage(null)}
        />
      )}
      </div>
    </div>
  );
};

export default MessageList;