import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Form,
  FormField,
  FormControl,
  FormMessage,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { NavLink } from "react-router-dom";

interface Inputs {
  phone: string;
  password: string;
  remember: boolean;
}

const Login = () => {
  const form = useForm<Inputs>({
    defaultValues: {
      phone: "",
      password: "",
      remember: false,
    },
  });

  function onSubmit(data: Inputs) {
    console.log(data);
  }

  return (
    <div className="w-full flex justify-center bg-background rounded-xl shadow-2xl">
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

      <div className="w-full sm:w-3/4 lg:w-1/2 flex justify-center items-center text-center">
        <Card className="w-3/4 border-none space-y-5">
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
              <form
                className="space-y-7"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2 bg-input rounded-lg px-3 py-1 shadow-sm">
                          <p>🇳🇵</p>
                          <p>+977</p>
                          <p>|</p>
                          <Input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={10}
                            placeholder="98XXXXXXXX"
                            autoComplete="tel"
                            className="border-none focus-visible:ring-0 !text-lg shadow-none"
                            required
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2 bg-input rounded-lg shadow-sm py-1">
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="border-none focus-visible:ring-0 !text-lg shadow-none"
                            required
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-between mt-2">
                  <FormField
                    control={form.control}
                    name="remember"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm select-none cursor-pointer">
                          Remember me
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <a href="#" className="text-sm">
                    Forgot password?
                  </a>
                </div>
                <Button
                  type="submit"
                  className="w-full py-2 text-lg rounded-lg shadow-md hover:scale-[1.02] transition"
                >
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
      </div>
    </div>
  );
};

export default Login;
