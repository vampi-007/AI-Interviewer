"use client"

import type React from "react"
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/sidebar"

export function AppLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    const isAuthPage = pathname.startsWith("/auth");


    return (
        <div className="flex flex-col md:flex-row h-screen">

            {!isAuthPage && <AppSidebar />}
            <main className="flex-1 overflow-auto">{children}</main>
        </div>
    )
}

