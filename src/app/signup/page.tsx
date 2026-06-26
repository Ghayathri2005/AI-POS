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
import { Eye, EyeOff, Sparkles, Loader2, Check, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required").min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Confirm password is required"),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignupValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      terms: false,
    },
  });

  // Calculate password strength indicators
  const hasMinLength = passwordValue.length >= 6;
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^A-Za-z0-9]/.test(passwordValue);

  const strengthScore = [
    hasMinLength,
    hasLowercase,
    hasUppercase,
    hasNumber,
    hasSpecial,
  ].filter(Boolean).length;

  const strengthLabel = () => {
    if (passwordValue.length === 0) return "";
    if (strengthScore <= 2) return "Weak";
    if (strengthScore <= 4) return "Medium";
    return "Strong";
  };

  const strengthColor = () => {
    if (strengthScore <= 2) return "bg-red-500";
    if (strengthScore <= 4) return "bg-orange-500";
    return "bg-green-500";
  };

  const onSubmit = async (data: SignupValues) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const resData = await response.json();

      if (!response.ok) {
        toast.error(resData.error || "Failed to create account. Please try again.");
      } else {
        toast.success("Account created successfully! Logging you in...");
        
        // Auto sign-in
        const result = await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });

        if (result?.error) {
          router.push("/login");
        } else {
          router.push("/");
          router.refresh();
        }
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
      <div className="w-full max-w-md p-8 space-y-7 bg-[#171717] border border-[#262626] rounded-3xl shadow-2xl relative overflow-hidden">
        {/* Sleek Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/10">
            <Sparkles size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Create an account</h1>
          <p className="text-zinc-500 text-sm mt-1">Get started with AI-POS Operating System today</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
              Full Name
            </Label>
            <Input
              id="name"
              placeholder=""
              type="text"
              disabled={isLoading || isGoogleLoading}
              className="h-10 bg-[#202020] border-[#2c2c2c] focus:border-indigo-500 rounded-xl text-zinc-100 focus-visible:ring-indigo-500"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
              Email Address
            </Label>
            <Input
              id="email"
              placeholder=""
              type="email"
              disabled={isLoading || isGoogleLoading}
              className="h-10 bg-[#202020] border-[#2c2c2c] focus:border-indigo-500 rounded-xl text-zinc-100 focus-visible:ring-indigo-500"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="password" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                placeholder=""
                type={showPassword ? "text" : "password"}
                disabled={isLoading || isGoogleLoading}
                className="h-10 bg-[#202020] border-[#2c2c2c] focus:border-indigo-500 rounded-xl text-zinc-100 pr-10 focus-visible:ring-indigo-500"
                {...register("password")}
                onChange={(e) => {
                  register("password").onChange(e);
                  setPasswordValue(e.target.value);
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            
            {/* Password Strength Indicator */}
            {passwordValue && (
              <div className="space-y-2 mt-2">
                <div className="flex justify-between items-center text-[10px] font-semibold tracking-wide uppercase">
                  <span className="text-zinc-500">Password Strength:</span>
                  <span className={cn(
                    strengthScore <= 2 && "text-red-400",
                    strengthScore <= 4 && strengthScore > 2 && "text-orange-400",
                    strengthScore > 4 && "text-green-400"
                  )}>{strengthLabel()}</span>
                </div>
                <div className="h-1 w-full bg-[#202020] rounded-full overflow-hidden flex gap-[2px]">
                  <div className={cn("h-full transition-all duration-300", strengthColor(), strengthScore >= 1 ? "w-1/5" : "w-0")} />
                  <div className={cn("h-full transition-all duration-300", strengthColor(), strengthScore >= 2 ? "w-1/5" : "w-0")} />
                  <div className={cn("h-full transition-all duration-300", strengthColor(), strengthScore >= 3 ? "w-1/5" : "w-0")} />
                  <div className={cn("h-full transition-all duration-300", strengthColor(), strengthScore >= 4 ? "w-1/5" : "w-0")} />
                  <div className={cn("h-full transition-all duration-300", strengthColor(), strengthScore >= 5 ? "w-1/5" : "w-0")} />
                </div>
                
                {/* Visual Checklist */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-zinc-500 pt-1">
                  <div className="flex items-center gap-1">
                    {hasMinLength ? <Check size={10} className="text-green-500" /> : <X size={10} className="text-zinc-600" />}
                    <span>6+ characters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasLowercase ? <Check size={10} className="text-green-500" /> : <X size={10} className="text-zinc-600" />}
                    <span>Lowercase letter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasUppercase ? <Check size={10} className="text-green-500" /> : <X size={10} className="text-zinc-600" />}
                    <span>Uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {hasNumber ? <Check size={10} className="text-green-500" /> : <X size={10} className="text-zinc-600" />}
                    <span>At least one number</span>
                  </div>
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="confirmPassword" className="text-zinc-300 text-xs font-semibold uppercase tracking-wider">
              Confirm Password
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                placeholder=""
                type={showConfirmPassword ? "text" : "password"}
                disabled={isLoading || isGoogleLoading}
                className="h-10 bg-[#202020] border-[#2c2c2c] focus:border-indigo-500 rounded-xl text-zinc-100 pr-10 focus-visible:ring-indigo-500"
                {...register("confirmPassword")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors bg-transparent border-none p-0 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-xs text-red-400 font-medium mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="terms"
              className="border-[#3a3a3a] text-indigo-500 focus-visible:ring-indigo-500 mt-[2px]"
              {...register("terms")}
            />
            <label
              htmlFor="terms"
              className="text-xs font-medium text-zinc-400 cursor-pointer leading-snug"
            >
              I agree to the{" "}
              <button type="button" onClick={() => toast.info("Terms of Service window.")} className="text-indigo-400 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer">
                Terms of Service
              </button>{" "}
              and{" "}
              <button type="button" onClick={() => toast.info("Privacy Policy window.")} className="text-indigo-400 hover:underline font-semibold bg-transparent border-none p-0 cursor-pointer">
                Privacy Policy
              </button>
            </label>
          </div>
          {errors.terms && (
            <p className="text-xs text-red-400 font-medium mt-1">{errors.terms.message}</p>
          )}

          <Button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full h-11 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-indigo-500/10 gap-2 cursor-pointer border-none mt-2"
          >
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Sign Up with Email
          </Button>
        </form>

        <div className="relative my-4">
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
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
