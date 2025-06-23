import { Eye, EyeOff } from "lucide-react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import type { FormInputProps } from "@/types/user";
import { useState } from "react";

const Password = ({ control }: FormInputProps<any>) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <FormField
      control={control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Password</FormLabel>
          <FormControl>
            <div className="auth-input-container">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="auth-input"
                required
                {...field}
              />
              <button
                type="button"
                className="mr-2"
                onClick={() => setShowPassword((e) => !e)}
              >
                {showPassword ? <Eye /> : <EyeOff />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default Password;
