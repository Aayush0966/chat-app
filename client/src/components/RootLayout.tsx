import { Outlet } from "react-router-dom";

const RootLayout = () => {
  return (
    <div className="min-h-screen bg-blue-300">
      <Outlet />
    </div>
  );
};

export default RootLayout;
