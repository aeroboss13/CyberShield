import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Shield, Eye, EyeOff } from "lucide-react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  password: z.string().min(8, "Password must be at least 8 characters")
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      name: "",
      password: ""
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterFormData) => {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Registration failed");
      }

      return response.json();
    },
    onSuccess: (user) => {
      // Invalidate current user query to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/users/current"] });
      
      toast({
        title: "Registration successful",
        description: `Welcome to SecHub, ${user.name}!`
      });
      
      // Redirect to dashboard
      setLocation("/dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: RegisterFormData) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen cyber-bg-dark flex items-center justify-center p-4">
      <Card className="w-full max-w-md cyber-bg-surface cyber-border">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 cyber-gradient rounded-xl flex items-center justify-center shadow-lg cyber-glow">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold cyber-text-red">Join SecHub</CardTitle>
          <CardDescription className="cyber-text-dim">
            Create your cybersecurity professional account
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="cyber-text-white">Username</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Choose a unique username"
                        className="cyber-input"
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="cyber-text-white">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="Enter your email address"
                        className="cyber-input"
                        disabled={registerMutation.isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="cyber-text-white">Full Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your full name"
                        className="cyber-input"
                        disabled={registerMutation.isPending}
                      />
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
                    <FormLabel className="cyber-text-white">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="cyber-input pr-10"
                          disabled={registerMutation.isPending}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-1 top-1 h-8 w-8 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4 cyber-text-dim" />
                          ) : (
                            <Eye className="w-4 h-4 cyber-text-dim" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full cyber-button-primary mt-6"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm cyber-text-dim">
              Already have an account?{" "}
              <a
                href="/login"
                className="cyber-text-blue hover:cyber-text-blue-light font-medium"
              >
                Sign in
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}