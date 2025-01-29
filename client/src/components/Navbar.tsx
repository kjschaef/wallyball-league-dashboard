
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard" },
    { href: "/players", label: "Players" },
    { href: "/record", label: "Record Match" },
  ];

  return (
    <nav className="bg-primary shadow-lg border-b border-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center h-16">
          <div className="text-xl font-bold text-primary-foreground tracking-tight">
            Volleyball League
          </div>
          <div className="ml-auto flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200",
                  location === item.href
                    ? "bg-primary-foreground/10 text-primary-foreground"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
