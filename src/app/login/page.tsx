"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean(),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginValues) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password. Please try again.");
      } else {
        toast.success("Welcome back! Redirecting...");
        router.push("/");
        router.refresh();
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      await signIn("google", { callbackUrl: "/" });
    } catch (error) {
      toast.error("Google sign-in failed.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#0a0a0a] px-4 py-12">
      <div className="w-full max-w-md p-8 space-y-8 bg-[#171717] border border-[#262626] rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Sleek Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-indigo-500/10">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Welcome back</h1>
          <p className="text-zinc-500 text-sm mt-1">Enter your details to sign in to your AI-POS account</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
              Email Address
            </Label>
            <Input
              id="email"
              placeholder=""
              type="email"
              disabled={isLoading || isGoogleLoading}
              className="h-11 bg-[#202020] border-[#2c2c2c] focus:border-indigo-500 rounded-xl text-zinc-100 focus-visible:ring-indigo-500"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
                Password
              </Label>
              <button
                type="button"
                onClick={() => toast.info("Password recovery is currently disabled.")}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium border-none bg-transparent cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Input
                id="password"
                placeholder=""
                type={showPassword ? "text" : "password"}
                disabled={isLoading || isGoogleLoading}
                className="h-11 bg-[#202020] border-[#2c2c2c] focus:border-indigo-500 rounded-xl text-zinc-100 pr-10 focus-visible:ring-indigo-500"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                className="border-[#3a3a3a] text-indigo-500 focus-visible:ring-indigo-500"
                {...register("rememberMe")}
              />
              <label
                htmlFor="rememberMe"
                className="text-xs font-medium text-zinc-400 cursor-pointer select-none"
              >
                Remember me
              </label>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/10 gap-2 cursor-pointer border-none"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Sign In with Email
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-[#262626]"></span>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
            <span className="bg-[#171717] px-3 text-zinc-500">Or continue with</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading || isGoogleLoading}
            className="w-full h-11 bg-[#202020] hover:bg-[#282828] text-zinc-100 border border-[#2c2c2c] rounded-xl font-medium gap-3 flex items-center justify-center cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Google
          </Button>
        </div>

        <p className="text-xs text-zinc-500 text-center">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
