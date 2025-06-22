import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import type { FormInputProps } from "@/types/user";

const Username = ({ control }: FormInputProps<any>) => {
  return (
    <FormField
      control={control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Username</FormLabel>
          <FormControl>
            <div className="auth-input-container">
              <Input
                type="text"
                placeholder="skyrocket69"
                className="auth-input"
                required
                {...field}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default Username;
