"use client"

import Link from "next/link"
import { useRouter } from "next/navigation";

import { ArrowRight } from "lucide-react"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { apiNoAuth } from "@/lib/api"
import { AxiosError } from "axios";
import { toast } from "sonner"
import { useAuth } from "@/context/AuthContext";
import { jwtDecode } from "jwt-decode";
import Cookies from 'js-cookie';

interface JwtPayload {
    sub: string,
    role: string;
    exp: number
}

const loginSchema = z.object({
    email: z.string().email({ message: "Invalid email address" }),
    password: z.string().min(5, "Password must be at least 8 characters long"),
});

export default function Login() {
    const router = useRouter();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { user, setUser } = useAuth();

    const loginForm = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const login = async (email: string, password: string) => {
        try {
            const response = await apiNoAuth.post("/login", {
                email,
                password,
            });

            Cookies.set("token", response.data.access_token);
            Cookies.set("refreshToken", response.data.refresh_token)
            const decodedToken = jwtDecode<JwtPayload>(response.data.access_token);
            console.log(decodedToken)

            setUser({
                email: decodedToken.sub,
                role: decodedToken.role,
                userId: response.data.user_id
            })

            return response.data;
        } catch (err: unknown) {
            const error = err as AxiosError<{ detail?: string }>;
            const message = error.response?.data?.detail || error.message;

            console.error("Login failed:", message);
            throw new Error(message);
        }
    };

    async function onSubmit(values: z.infer<typeof loginSchema>) {
        try {
            const { email, password } = values;

            await login(email, password); // assuming email is used as username
            toast.message("Login Successfull")
            router.push("/")

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
                    <h2 className="mt-2 text-xl font-semibold text-gray-700">Sign in to your account</h2>
                    <p className="mt-2 text-sm text-gray-600">Practice interviews with AI and improve your skills</p>
                </div>
                <div className="mt-8 rounded-lg bg-white p-6 shadow sm:p-8">
                    <Form {...loginForm}>
                        <form onSubmit={loginForm.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <FormField
                                    control={loginForm.control}
                                    name="email"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-gray-700">Email</FormLabel>
                                            <FormControl>
                                                <Input className="w-full" placeholder="you@example.com" autoComplete="email" type="email" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="space-y-2">
                                <FormField
                                    control={loginForm.control}
                                    name="password"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-sm font-medium text-gray-700">Password</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="password"
                                                    autoComplete="current-password"
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
                                <Button type="submit" className="w-full cursor-pointer">
                                    Sign in
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
                                <span className="bg-white px-2 text-gray-500">Don&apos;t have an account?</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <Link href="/auth/register">
                                <Button variant="outline" className="w-full cursor-pointer">
                                    Create an account
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}


