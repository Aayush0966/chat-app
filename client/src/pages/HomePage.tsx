import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect } from "react";

const HomePage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      navigate("/login");
      return;
    }
    const interval = setInterval(() => {
      toast("Welcome to the Homepage!");
    }, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  return <div>Homepage</div>;
};

export default HomePage;
