import { Outlet } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";

const RootLayout = () => {
  return (
    <div className="min-h-screen max-h-screen flex lg:p-10 bg-accent">
      <Toaster
        toastOptions={{
          style: {
            background: "var(--popover)",
            color: "var(--primary)",
            borderColor: "var(--border)",
            boxShadow: "var(--shadow-lg)",
            fontSize: "1rem",
          },
        }}
      />
      <Outlet />
    </div>
  );
};

export default RootLayout;
