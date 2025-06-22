import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "./ui/form";
import { Input } from "./ui/input";
import type { FormInputProps } from "@/types/user";

const Phone = ({ control }: FormInputProps<any>) => {
  return (
    <FormField
      control={control}
      name="phoneNumber"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Phone</FormLabel>
          <FormControl>
            <div className="auth-input-container px-3">
              <p>🇳🇵</p>
              <p>+977</p>
              <p>|</p>
              <Input
                type="tel"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={10}
                placeholder="98XXXXXXXX"
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

export default Phone;
