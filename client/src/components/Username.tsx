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
    <div className="flex justify-between gap-3">
    <FormField
      control={control}
      name="firstName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>First Name</FormLabel>
          <FormControl>
            <div className="auth-input-container">
              <Input
                type="text"
                placeholder="sky"
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
    <FormField
      control={control}
      name="lastName"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Last Name</FormLabel>
          <FormControl>
            <div className="auth-input-container">
              <Input
                type="text"
                placeholder="rocket"
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
    </div>
  );
};

export default Username;
