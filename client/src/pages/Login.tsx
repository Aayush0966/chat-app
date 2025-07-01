import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import type { LoginFormInputs } from "@/types/user";
import { loginUser } from "@/services/api";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import Phone from "@/components/Phone";
import Password from "@/components/Password";
import { useEffect } from "react";

const Login = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      navigate("/home");
    }
  }, [navigate]);

  const form = useForm<LoginFormInputs>({
    defaultValues: {
      phoneNumber: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormInputs) {
    console.log(data);
    try {
      await loginUser(data);
      toast.success("Login Successfull!");
      navigate("/home");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Card className="xl:w-3/4 border-none space-y-5">
      <CardHeader>
        <CardTitle className="text-3xl">
          Login to <span className="text-primary">ChatApp</span>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Use an existing account to continue into the messaging space.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-7" onSubmit={form.handleSubmit(onSubmit)}>
            <Phone control={form.control} />
            <Password control={form.control} />
            <div className="flex justify-end mt-2">
              <NavLink to="/auth/forgot-password" className="text-sm">
                Forgot password?
              </NavLink>
            </div>
            <Button type="submit" className="auth-button">
              Sign In
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="grid gap-6">
        <Separator />
        <div className="text-center text-sm flex justify-center gap-3">
          <p>Don't have an account?</p>
          <NavLink to="/register" className="font-semibold">
            Create account
          </NavLink>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Login;
