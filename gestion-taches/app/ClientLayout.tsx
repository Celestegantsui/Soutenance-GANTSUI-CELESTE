"use client";

import "@/lib/axiosConfig";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { AuthProvider } from "@/lib/AuthContext";
import { NotificationProvider } from "@/lib/NotificationContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { LayoutProvider } from "@/lib/LayoutContext";
import { usePathname } from "next/navigation";

function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  if (isLoginPage) {
    return (
      <div className="flex flex-col min-h-screen bg-[#F5F7F8]">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-6">{children}</main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-[#F5F7F8] overflow-y-auto">
          <main className="flex-1 p-6">{children}</main>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider>
        <NotificationProvider>
          <LayoutProvider>
            <AppShell>{children}</AppShell>
          </LayoutProvider>
        </NotificationProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
