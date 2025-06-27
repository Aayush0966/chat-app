import { useForm } from "react-hook-form";
import { useState } from "react";
import { useNavigate, NavLink } from "react-router-dom";
import { forgotPassword } from "@/services/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Separator } from "@/components/ui/separator";
import Email from "@/components/Email";
import type { ForgotFormInputs } from "@/types/user";

const Forgot = () => {
  const navigate = useNavigate();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const form = useForm<ForgotFormInputs>({
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(data: ForgotFormInputs) {
    console.log(data)
    try {
      await forgotPassword(data);
      setOtpSent(true);
      toast.success("OTP sent to your phone/email!");
    } catch (err) {
      toast.error("Failed to send OTP");
    }
  }

  function onOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp === "888888") {
      toast.success("OTP verified! Redirecting to reset password...");
      setTimeout(() => navigate("/login"), 2000);
    } else {
      toast.error("Invalid OTP");
    }
  }

  return (
    <Card className="xl:w-3/4 border-none space-y-5">
      <CardHeader>
        <CardTitle className="text-3xl">
          Forgot <span className="text-primary">Password</span>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Enter your phone number or email to receive a reset code.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!otpSent ? (
          <Form {...form}>
            <form className="space-y-7" onSubmit={form.handleSubmit(onSubmit)}>
              <Email control={form.control} />
              <Button type="submit" className="auth-button">
                Send OTP
              </Button>
            </form>
          </Form>
        ) : (
          <form className="space-y-7" onSubmit={onOtpSubmit}>
            <div className="flex flex-col gap-4 items-center">
              <label className="text-sm">
                Enter the 6-digit code sent to you
              </label>
              <InputOTP
                maxLength={6}
                value={otp}
                onChange={setOtp}
                containerClassName="justify-center"
              >
                <InputOTPGroup>
                  {[...Array(6)].map((_, i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
                <InputOTPSeparator />
              </InputOTP>
            </div>
            <Button type="submit" className="auth-button">
              Verify OTP
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="grid gap-6">
        <Separator />
        <div className="text-center text-sm flex justify-center gap-3">
          <NavLink to="/login" className="font-semibold">
            Back to Login
          </NavLink>
        </div>
      </CardFooter>
    </Card>
  );
};

export default Forgot;
