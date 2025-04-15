"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

interface Props {
    children: React.ReactNode;
}

export const AppLayoutWrapper = ({ children }: Props) => {
    const pathname = usePathname();
    const hideSidebar = pathname === "/auth/login" || pathname === "/auth/register";

    return (
        <div className="flex min-h-screen">
            <SidebarProvider>
                {!hideSidebar && <AppSidebar />}
                <main className="flex-1 overflow-auto">{children}</main>
            </SidebarProvider>
        </div>
    );
};
