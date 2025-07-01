import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

const RootLayout = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-muted/20 dark">
      {/* Ambient background effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-20 pointer-events-none" />
      
      {/* Main content with glass effect container */}
      <div className="relative z-10 min-h-screen flex p-4 lg:p-8">
        <div className="w-full max-w-7xl mx-auto bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl lg:rounded-3xl shadow-2xl overflow-hidden">
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "hsl(var(--background))",
                color: "hsl(var(--foreground))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "12px",
                boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                fontSize: "0.875rem",
                fontWeight: "500",
              },
            }}
            className="font-medium"
          />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default RootLayout;
