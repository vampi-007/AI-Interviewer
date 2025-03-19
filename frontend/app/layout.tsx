import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { ResumeProvider } from "@/context/resume-context"
import { AuthProvider } from "@/context/auth-context"
import { AppLayout } from "@/components/layouts/app-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Interviewer",
  description: "AI-powered interview preparation tool",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} dark`}>
        <AuthProvider>
          <ResumeProvider>
            <AppLayout>
              <Providers>{children}</Providers>
            </AppLayout>
          </ResumeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}

