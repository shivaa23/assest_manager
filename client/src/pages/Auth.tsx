import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema } from "@shared/schema";
import { useLogin, useRegister } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { z } from "zod";

type AuthFormValues = z.infer<typeof insertUserSchema>;

export default function AuthPage({ mode }: { mode: "login" | "register" }) {
  const [, setLocation] = useLocation();
  const { mutate: login, isPending: isLoggingIn } = useLogin();
  const { mutate: register, isPending: isRegistering } = useRegister();
  
  const { register: registerField, handleSubmit, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(insertUserSchema),
  });

  const onSubmit = async (data: AuthFormValues) => {
    if (mode === "login") {
      login(data, {
        onSuccess: () => setLocation("/"),
      });
    } else {
      register(data, {
        onSuccess: () => setLocation("/login"),
      });
    }
  };

  const isPending = isLoggingIn || isRegistering;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl border border-border shadow-lg">
        <div className="text-center mb-8">
          <Link href="/">
             <span className="font-serif text-3xl font-bold text-primary block mb-2 cursor-pointer">PARNI</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            {mode === "login" 
              ? "Enter your credentials to access your account" 
              : "Sign up to start shopping for exclusive jewellery"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" {...registerField("username")} placeholder="johndoe" />
            {errors.username && <p className="text-destructive text-sm">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...registerField("password")} placeholder="••••••••" />
            {errors.password && <p className="text-destructive text-sm">{errors.password.message}</p>}
          </div>

          <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90 h-11" disabled={isPending}>
            {isPending ? <Loader2 className="animate-spin mr-2" /> : null}
            {mode === "login" ? "Sign In" : "Sign Up"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <Link href="/register" className="font-semibold text-primary hover:underline">
                Register
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-primary hover:underline">
                Login
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
