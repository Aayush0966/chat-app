import { useChat } from "@/hooks/useChat";
import { 
  Sidebar, 
  ChatHeader, 
  MessageList, 
  MessageInput, 
  NewChatModal, 
  EmptyState 
} from "@/components/chat";
import { useSocket } from "@/hooks/useSocket";

const HomePage = () => {
  const {
    chats,
    selectedChat,
    message,
    messages,
    loading,
    messagesLoading,
    searchQuery,
    showNewChat,
    userSearchQuery,
    searchedUsers,
    currentUser,
    isMobileSidebarOpen,
    setMessage,
    setMessages,
    setChats,
    setSearchQuery,
    setShowNewChat,
    setUserSearchQuery,
    setIsMobileSidebarOpen,
    handleSend,
    handleUserSearch,
    handleCreateChat,
    handleDeleteChat,
    handleDeleteMessage,
    handleLogout,
    handleChatSelect,
  } = useChat();

  useSocket({ setMessages, setChats });
  
  if (showNewChat) {
    return (
      <NewChatModal
        userSearchQuery={userSearchQuery}
        setUserSearchQuery={setUserSearchQuery}
        searchedUsers={searchedUsers}
        onUserSearch={handleUserSearch}
        onCreateChat={handleCreateChat}
        onClose={() => setShowNewChat(false)}
      />
    );
  }

  return (
    <div className="h-full max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-8rem)] w-full flex relative overflow-hidden bg-background/60 backdrop-blur-sm">
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}
      
      <Sidebar
        chats={chats}
        selectedChat={selectedChat}
        currentUser={currentUser}
        loading={loading}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onChatSelect={handleChatSelect}
        onNewChat={() => setShowNewChat(true)}
        onLogout={handleLogout}
        onDeleteChat={handleDeleteChat}
        onClose={() => setIsMobileSidebarOpen(false)}
        isOpen={isMobileSidebarOpen}
      />
      
      <div className="flex-1 flex flex-col min-h-0 bg-background/40 backdrop-blur-sm">
        {!selectedChat ? (
          <EmptyState onNewChat={() => setShowNewChat(true)} />
        ) : (
          <>
            <ChatHeader
              selectedChat={selectedChat}
              onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
            />
            
            <MessageList
              messages={messages}
              currentUser={currentUser}
              selectedChat={selectedChat}
              messagesLoading={messagesLoading}
              onDeleteMessage={handleDeleteMessage}
            />
            
            <MessageInput
              message={message}
              setMessage={setMessage}
              onSend={handleSend}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
