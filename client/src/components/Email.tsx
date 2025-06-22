import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import type { FormInputProps } from "@/types/user";

const Email = ({ control }: FormInputProps<any>) => {
  return (
    <FormField
      control={control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <div className="auth-input-container">
              <Input
                type="email"
                placeholder="skyrocket69@email.com"
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

export default Email;
