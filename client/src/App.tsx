import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Homepage from "@/pages/HomePage";
import RootLayout from "@/components/layouts/RootLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import AuthLayout from "@/components/layouts/AuthLayout";
import Forgot from "@/pages/Forgot";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootLayout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Homepage />} />
          <Route element={<AuthLayout />}>
            <Route path="/auth/">
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="forgot-password" element={<Forgot />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
