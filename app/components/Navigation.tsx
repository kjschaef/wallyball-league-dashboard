"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "../lib/utils";
import { 
  LayoutDashboard, 
  History, 
  Medal, 
  BarChart, 
  Users 
} from "lucide-react";

export function Navigation() {
  const pathname = usePathname();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Game History",
      href: "/history",
      icon: History,
    },
    {
      name: "Results",
      href: "/results",
      icon: Medal,
    },
    {
      name: "Player Analytics",
      href: "/analytics",
      icon: BarChart,
    },
    {
      name: "Players",
      href: "/players",
      icon: Users,
    },
  ];

  return (
    <nav className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0 p-4 bg-background border-b">
      <Link href="/dashboard" className="font-bold text-lg mb-2 md:mb-0 md:mr-6">
        Wallyball League
      </Link>
      <div className="flex flex-col md:flex-row md:items-center md:space-x-1 space-y-1 md:space-y-0">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center px-3 py-2 text-sm rounded-md",
              pathname === item.href
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            )}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </div>
    </nav>
  );
}
