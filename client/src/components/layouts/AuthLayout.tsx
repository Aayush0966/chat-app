import { Outlet } from "react-router-dom";

const AuthPage = () => {
  return (
    <div className="w-full h-full flex justify-center lg:bg-background rounded-xl shadow-2xl">
      <div className="w-1/2 hidden lg:flex justify-center items-center text-center relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-background">
        <div className="space-y-8 z-10 relative">
          <div className="relative">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-primary via-chart-2 to-chart-3 bg-clip-text text-transparent animate-pulse-soft">
              ChatFlow
            </h1>
            <div className="absolute inset-0 text-6xl font-bold text-primary/20 blur-sm animate-pulse">
              ChatFlow
            </div>
          </div>
          <p className="text-2xl text-primary font-semibold">Welcome!</p>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-md">
            Connect, share, and chat with friends from around the globe in real-time.
          </p>
          <div className="flex justify-center gap-4 mt-8">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-chart-1 to-chart-2 animate-bounce"></div>
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-chart-2 to-chart-3 animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-chart-3 to-chart-4 animate-bounce" style={{animationDelay: '0.2s'}}></div>
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-chart-4 to-chart-5 animate-bounce" style={{animationDelay: '0.3s'}}></div>
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-chart-5 to-primary animate-bounce" style={{animationDelay: '0.4s'}}></div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-gradient-to-br from-primary/30 to-transparent rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-gradient-to-br from-chart-2/30 to-transparent rounded-full blur-2xl animate-pulse-soft"></div>
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-gradient-to-br from-chart-3/40 to-transparent rounded-full blur-lg animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="w-full lg:w-1/2 p-4 flex justify-center items-center text-center">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthPage;
