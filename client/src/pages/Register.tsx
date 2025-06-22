import { useForm } from "react-hook-form";
import { NavLink, useNavigate } from "react-router-dom";
import type { RegisterFormInputs } from "@/types/user";
import { registerUser } from "@/services/api";

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

import Username from "@/components/Username";
import Email from "@/components/Email";
import Phone from "@/components/Phone";
import Password from "@/components/Password";
import { useEffect } from "react";

const Register = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      navigate("/home");
    }
  }, [navigate]);

  const form = useForm<RegisterFormInputs>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
      password: "",
    },
  });

  async function onSubmit(data: RegisterFormInputs) {
    console.log(data);
    try {
      await registerUser(data);
      toast.success("Successfully Registered!");
      navigate("/login");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <Card className="xl:w-3/4 border-none space-y-5">
      <CardHeader>
        <CardTitle className="text-3xl">
          Register for <span className="text-primary">ChatApp</span>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Create a new account to join the messaging space.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form className="space-y-7" onSubmit={form.handleSubmit(onSubmit)}>
            <Username control={form.control} />
            <Email control={form.control} />
            <Phone control={form.control} />
            <Password control={form.control} />
            <Button type="submit" className="auth-button">
              Register
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="grid gap-6">
        <Separator />
        <div className="text-center text-sm flex justify-center gap-3">
          <p>Already have an account?</p>
          <NavLink to="/login" className="font-semibold">
            Login
          </NavLink>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Register;
