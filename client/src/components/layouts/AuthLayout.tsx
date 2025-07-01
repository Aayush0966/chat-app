import { Outlet } from "react-router-dom";

const AuthPage = () => {
  return (
    <div className="w-full flex justify-center lg:bg-background rounded-xl shadow-2xl">
      <div className="w-1/2 hidden lg:flex justify-center items-center text-center relative rounded-xl overflow-hidden">
        <div className="space-y-5 z-10">
          <p className="text-4xl text-primary">Welcome!</p>
          <p className="text-xl">Join your friends all over the world.</p>
          <div className="flex justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-chart-1"></div>
            <div className="w-3 h-3 rounded-full bg-chart-2"></div>
            <div className="w-3 h-3 rounded-full bg-chart-3"></div>
            <div className="w-3 h-3 rounded-full bg-chart-4"></div>
            <div className="w-3 h-3 rounded-full bg-chart-5"></div>
          </div>
        </div>
        <div className="w-full h-full bg-[url('https://plus.unsplash.com/premium_photo-1682023585957-f191203ab239?q=80&w=784&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover absolute opacity-80 blur-sm"></div>
      </div>

      <div className="w-full lg:w-1/2 p-4 flex justify-center items-center text-center">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthPage;
