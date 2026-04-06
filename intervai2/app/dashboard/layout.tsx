"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    LayoutDashboard, Mic, BookOpen, BarChart2, FileText,
    LogOut, MoreHorizontal, Flame, Sun, Moon,
} from "lucide-react";
import { useAuthListener, useTheme, signOut } from "@/lib/auth";

const navItems = [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Interviews", icon: Mic, href: "/dashboard/interviews" },
    { label: "Quizzes", icon: BookOpen, href: "/quiz" },
    { label: "Analytics", icon: BarChart2, href: "/dashboard/analytics" },
    { label: "Streaks", icon: Flame, href: "/dashboard/streaks" },
    { label: "Resume Review", icon: FileText, href: "/dashboard/resume" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, loading } = useAuthListener();
    const { isDark, toggleTheme } = useTheme();
    const [showUserMenu, setShowUserMenu] = useState(false);

    useEffect(() => {
        if (!loading && !user) router.push("/signup");
    }, [user, loading, router]);

    const handleSignOut = async () => { await signOut(); router.push("/"); };

    const t = {
        pageBg: isDark ? "bg-[#0f1629]" : "bg-[#f0f4ff]",
        sidebar: isDark ? "bg-[#0a0f1e] border-white/5" : "bg-white border-gray-200",
        logoText: isDark ? "text-white" : "text-gray-900",
        activeNav: isDark ? "bg-blue-600/20 text-blue-400 border-blue-500/20" : "bg-blue-600/10 text-blue-600 border-blue-600/20",
        inactiveNav: isDark ? "text-gray-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
        userBorder: isDark ? "border-white/5" : "border-gray-200",
        userName: isDark ? "text-white" : "text-gray-900",
        userRole: isDark ? "text-purple-400" : "text-purple-600",
        userHover: isDark ? "hover:bg-white/5" : "hover:bg-gray-50",
        moreIcon: isDark ? "text-gray-500 group-hover:text-gray-300" : "text-gray-400 group-hover:text-gray-700",
        dropdownBg: isDark ? "bg-[#1a2035] border-white/10" : "bg-white border-gray-200",
        toggleBtn: isDark ? "bg-white/10 hover:bg-white/20 text-yellow-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600",
        spinnerBg: isDark ? "bg-[#0f1629]" : "bg-[#f0f4ff]",
    };

    if (loading || !user) {
        return (
            <div className={`min-h-screen ${t.spinnerBg} flex items-center justify-center`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                    <p className="text-gray-400 text-sm">Loading…</p>
                </div>
            </div>
        );
    }

    const initials = user.displayName
        ? user.displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : user.email?.[0].toUpperCase() ?? "U";

    return (
        <div className={`min-h-screen ${t.pageBg} text-${isDark ? "white" : "gray-900"} flex transition-colors duration-300`}>

            <aside className={`fixed top-0 left-0 h-full w-[168px] ${t.sidebar} border-r flex flex-col z-30 transition-colors duration-300`}>

                <div className={`px-4 py-4 border-b ${t.userBorder} flex items-center justify-between`}>
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-500/30 blur-md rounded-full" />
                            <Image src="/logo.svg" alt="Intervai" width={20} height={20} className="relative z-10" />
                        </div>
                        <span className={`text-sm font-bold tracking-tight ${t.logoText}`}>
                            Interv<span className="text-blue-500">ai</span>
                        </span>
                    </Link>
                    {/* Sun / Moon toggle */}
                    <button
                        onClick={toggleTheme}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 ${t.toggleBtn}`}
                        aria-label="Toggle theme"
                    >
                        {isDark ? <Sun size={13} /> : <Moon size={13} />}
                    </button>
                </div>

                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map(({ label, icon: Icon, href }) => {
                        const active = href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);
                        return (
                            <Link
                                key={label}
                                href={href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${active ? t.activeNav : t.inactiveNav} border border-transparent`}
                            >
                                <Icon size={16} />
                                {label}
                            </Link>
                        );
                    })}
                </nav>

                <div className={`px-3 py-4 border-t ${t.userBorder} relative`}>
                    <button
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all duration-200 group ${t.userHover}`}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                        {user.photoURL ? (
                            <img src={user.photoURL} alt={user.displayName ?? "User"} className="w-8 h-8 rounded-full ring-2 ring-blue-500/30 object-cover flex-shrink-0" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold flex-shrink-0 ring-2 ring-blue-500/30 text-white">
                                {initials}
                            </div>
                        )}
                        <div className="flex-1 text-left overflow-hidden">
                            <p className={`text-xs font-semibold truncate ${t.userName}`}>{user.displayName ?? user.email}</p>
                            <p className={`text-[10px] font-medium ${t.userRole}`}>Pro Member</p>
                        </div>
                        <MoreHorizontal size={15} className={`${t.moreIcon} transition flex-shrink-0`} />
                    </button>

                    {showUserMenu && (
                        <div className={`absolute bottom-full left-3 right-3 mb-2 ${t.dropdownBg} border rounded-xl p-1 shadow-xl z-50`}>
                            <button
                                onClick={handleSignOut}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <LogOut size={14} />
                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </aside>

            <main className="ml-[168px] flex-1 min-h-screen overflow-y-auto transition-colors duration-300">
                {children}
            </main>
        </div>
    );
}
