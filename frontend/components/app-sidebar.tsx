"use client";
import { Home, Info, MessageSquare, PanelLeft } from "lucide-react";

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarTrigger,
    useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

// Navigation items with their icons
const navItems = [
    {
        title: "Home",
        icon: Home,
        url: "#",
    },
    {
        title: "About Us",
        icon: Info,
        url: "#",
    },
    {
        title: "Contact",
        icon: MessageSquare,
        url: "#",
    },
];

export function AppSidebar() {
    const { state } = useSidebar();
    const isCollapsed = state === "collapsed";

    return (
        <Sidebar
            collapsible="icon"
            className="bg-gray-50 text-gray-500 border-r border-gray-200"
        >
            <SidebarHeader className="p-4 flex items-center justify-between border-b border-gray-200">
                {!isCollapsed && (
                    <div className="text-xl font-bold text-gray-800">v0</div>
                )}
                {isCollapsed && (
                    <div className="text-xl font-bold mx-auto text-gray-800">v0</div>
                )}
                {!isCollapsed && (
                    <SidebarTrigger className="h-10 w-10 rounded-md bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center">
                        <PanelLeft className="h-8 w-8" />
                    </SidebarTrigger>
                )}
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
                <SidebarMenu>
                    {navItems.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton
                                asChild
                                tooltip={isCollapsed ? item.title : undefined}
                                className={cn(
                                    "flex items-center gap-4 rounded-md px-4 py-3 text-gray-500 hover:bg-gray-200 transition-colors",
                                    isCollapsed && "justify-center"
                                )}
                            >
                                <a href={item.url} className="flex items-center gap-4">
                                    <item.icon className="h-8 w-8" />
                                    {!isCollapsed && <span className="text-lg">{item.title}</span>}
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className={cn("p-4 border-t border-gray-200", isCollapsed ? "flex flex-col items-center" : "flex justify-between items-center")}>
                {isCollapsed && (
                    <SidebarTrigger className="h-10 w-10 rounded-md bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center mb-4">
                        <PanelLeft className="h-8 w-8" />
                    </SidebarTrigger>
                )}
                {!isCollapsed && (
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-md bg-purple-500"></div>
                        <span className="text-gray-700 font-medium">Profile</span>
                    </div>
                )}
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
