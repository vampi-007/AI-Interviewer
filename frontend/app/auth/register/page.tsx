"use client";

import Link from "next/link"
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { apiNoAuth } from "@/lib/api";
import { AxiosError } from "axios";
import { toast } from "sonner";

const registerSchema = z.object({
    username: z.string().min(5, "User name must be 5 character long"),
    email: z.string().email({ message: "Invalid Email" }),
    password: z.string().min(5, "Password must be at least 8 characters long"),

});

export default function Register() {
    const router = useRouter();

    const registerForm = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            username: "",
            email: "",
            password: ""
        }
    });

    const register = async (username: string, email: string, password: string) => {
        try {
            const response = await apiNoAuth.post("/register", {
                username,
                email,
                password,
            });
            return response.data;
        } catch (err: unknown) {
            const error = err as AxiosError<{ detail?: string }>;
            const message = error.response?.data?.detail || error.message;
            console.error("Login failed:", message);
            throw new Error(message);
        }
    };

    async function onSubmit(values: z.infer<typeof registerSchema>) {
        try {
            const { username, email, password } = values;
            await register(username, email, password);
            router.push("/auth/login")
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : "An unexpected error occurred.";
            toast.error("Login failed", {
                description: message
            })
            console.error("Login error:", err);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">AI-Interviewer</h1>
                    <h2 className="mt-2 text-xl font-semibold text-gray-700">Create your account</h2>
                    <p className="mt-2 text-sm text-gray-600">Start practicing interviews with AI today</p>
                </div>
                <div className="mt-8 rounded-lg bg-white p-6 shadow sm:p-8">

                    <Form {...registerForm}>
                        <form onSubmit={registerForm.handleSubmit(onSubmit)} className="space-y-6" >
                            <div className="space-y-2">
                                <FormField
                                    control={registerForm.control}
                                    name="username"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>User Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="text"
                                                    autoComplete="username"
                                                    required
                                                    className="w-full"
                                                    placeholder="johndoe"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormField
                                    control={registerForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    autoComplete="email"
                                                    required
                                                    className="w-full"
                                                    placeholder="you@example.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormField
                                    control={registerForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    autoComplete="new-password"
                                                    required
                                                    className="w-full"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div>
                                <Button type="submit" className="w-full">
                                    Create account
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </form>
                    </Form>



                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="bg-white px-2 text-gray-500">Already have an account?</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link href="/login">
                                <Button variant="outline" className="w-full">
                                    Sign in
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

