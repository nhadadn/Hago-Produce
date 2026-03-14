"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/hooks/useAuth";
import { getNavigation } from "@/config/navigation";
import { useLanguage } from "@/lib/i18n";
import { Role } from "@prisma/client";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const navigation = getNavigation(t);

  // If no user is loaded yet (or not logged in), we might show nothing or a loading state.
  // But usually this component is part of a protected layout.
  // For safety, we filter assuming user might be null.
  const filteredNavItems = user
    ? navigation.filter((item) => item.roles.includes(user.role as Role))
    : [];

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden",
          isOpen ? "block" : "hidden"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-hago-primary-800 bg-hago-primary-900 transition-transform lg:translate-x-0 lg:static lg:block flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center border-b border-hago-primary-800 px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-xl font-bold text-white">Hago Produce</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden text-white hover:bg-hago-primary-800"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
            <span className="sr-only">{t.header.closeMenu}</span>
          </Button>
        </div>

        <div className="flex-1 overflow-auto py-4">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4 gap-1">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                    isActive
                      ? "bg-hago-primary-800 text-white"
                      : "text-hago-primary-100 hover:bg-hago-primary-800 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.title}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-hago-primary-800 p-4">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-hago-primary-700 bg-transparent text-hago-primary-100 hover:bg-hago-primary-800 hover:text-white"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            {t.common.logout}
          </Button>
        </div>
      </div>
    </>
  );
}
