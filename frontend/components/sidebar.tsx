"use client"

import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar"
import { useAuth } from "@/context/auth-context"
import {
    LayoutDashboard,
    MessageSquare,
    User,
    LogOut,
    Menu,
    EthernetPort,
    Text,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function AppSidebar() {
    const { username, logout } = useAuth()
    const [open, setOpen] = useState(false)
    const pathname = usePathname()
    const [isMobile, setIsMobile] = useState(false)

    // Determine if mobile or desktop
    useEffect(() => {
        const checkIfMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkIfMobile()
        window.addEventListener("resize", checkIfMobile)
        return () => window.removeEventListener("resize", checkIfMobile)
    }, [])

    const links = [
        {
            label: "Dashboard",
            href: "/dashboard",
            icon: (
                <LayoutDashboard className="h-7 w-7 text-neutral-700 dark:text-neutral-300" />
            ),
        },
        {
            label: "Interview",
            href: "/interview-type",
            icon: (
                <EthernetPort className="h-7 w-7 text-neutral-700 dark:text-neutral-300" />
            ),

        },
        {
            label: "Resume Upload",
            href: "/",
            icon: (
                <MessageSquare className="h-7 w-7 text-neutral-700 dark:text-neutral-300" />
            ),
        },
        {
            label: "Profile",
            href: "/profile",
            icon: <User className="h-7 w-7 text-neutral-700 dark:text-neutral-300" />,
        },
        {
            label: "Prompts",
            href: "/prompts",
            icon: <Text />
        }
    ]

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* --- Top Brand / Logo Area --- */}
            <div className="p-4">
                <div className="flex items-center gap-2">
                    <Menu className="h-6 w-6 text-[#F39C12]" />
                    {/* Show brand name only if open or on mobile */}
                    {(open || isMobile) && (
                        <h1 className="text-xl font-bold">AI Interviewer</h1>
                    )}
                </div>
            </div>

            {/* --- Nav Links in the Middle --- */}
            <nav className="flex-1 px-2 space-y-1 overflow-auto">
                {links.map((link) => (
                    <SidebarLink
                        key={link.href}
                        link={link}
                        className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-700",
                            pathname === link.href && "bg-neutral-200 dark:bg-neutral-700"
                        )}
                    />
                ))}
            </nav>

            {/* --- Bottom User Info / Logout --- */}
            <div className="border-t border-neutral-200 dark:border-neutral-700 p-4">
                <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="/placeholder.svg?height=40&width=40" />
                        <AvatarFallback className="bg-[#2C3E50] text-white">
                            {username?.charAt(0) || "U"}
                        </AvatarFallback>
                    </Avatar>
                    {/* Show user details only if open or on mobile */}
                    {(open || isMobile) && (
                        <div>
                            <p className="text-sm font-medium">{username || "User"}</p>
                            <p className="text-xs text-neutral-500">Free Plan</p>
                        </div>
                    )}
                </div>
                {/* Logout button also only when open or mobile */}
                {(open || isMobile) && (
                    <Button
                        variant="outline"
                        className="w-full justify-start gap-2 text-red-500 border-neutral-300 dark:border-neutral-700"
                        onClick={logout}
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </Button>
                )}
            </div>
        </div>
    )

    return (
        <Sidebar open={open} setOpen={setOpen}>
            <SidebarBody>{sidebarContent}</SidebarBody>
        </Sidebar>
    )
}
