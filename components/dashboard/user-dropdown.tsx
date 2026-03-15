"use client";

import { signOut } from "next-auth/react";
import { LogOut, User } from "lucide-react";
import { showLogoutOverlay } from "@/contexts/logout-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { UserRole } from "@/app/generated/prisma";
import { isAdminOrHigher } from "@/lib/permissions/role-utils";

interface UserDropdownProps {
  userName: string;
  userRole: UserRole | null;
}

export default function UserDropdown({
  userName,
  userRole,
}: UserDropdownProps) {
  const hasAdminRole = isAdminOrHigher(userRole);

  const handleLogout = async () => {
    showLogoutOverlay();
    await signOut({ callbackUrl: "/" });
  };

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
            <div
              className={`flex items-center justify-center size-10 rounded-full bg-yellow-300 border-2 ${
                hasAdminRole ? "border-red-500/50" : "border-gray-300"
              }`}
            >
              <User className="size-6 text-gray-600" />
            </div>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{userName}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          {userName}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleLogout}
          variant="destructive"
          className="cursor-pointer"
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
