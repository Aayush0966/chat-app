import { Outlet } from "react-router-dom";

const RootLayout = () => {
  return (
    <div className="min-h-screen flex lg:p-10 bg-accent">
      <Outlet />
    </div>
  );
};

export default RootLayout;
