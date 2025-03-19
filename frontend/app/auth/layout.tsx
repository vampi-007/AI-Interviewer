import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { Providers } from "@/components/providers"
import { ResumeProvider } from "@/context/resume-context"
import { AuthProvider } from "@/context/auth-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "AI Interviewer",
    description: "AI-powered interview preparation tool",
}

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <>
            <div className={`${inter.className} dark`}>
                <AuthProvider>
                    <ResumeProvider>
                        <Providers>{children}</Providers>
                    </ResumeProvider>
                </AuthProvider>
            </div>
        </>
    )
}

