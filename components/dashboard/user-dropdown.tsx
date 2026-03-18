"use client";

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
import { useState } from "react";
import Image from "next/image";
import { logoutAction } from "@/actions/auth";

interface UserDropdownProps {
  userName: string;
  userRole: UserRole | null;
  userImage?: string | null;
  restaurantName?: string | null;
}

export default function UserDropdown({
  userName,
  userRole,
  userImage: initialUserImage,
  restaurantName,
}: UserDropdownProps) {
  const hasAdminRole = isAdminOrHigher(userRole);
  const [userImage] = useState<string | null>(initialUserImage ?? null);
  const handleLogout = async () => {
    showLogoutOverlay();
    await logoutAction();
  };

  return (
    <DropdownMenu modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger className="focus:outline-none cursor-pointer">
            <div
              className={`flex items-center justify-center size-9 rounded-full bg-yellow-300 border-2 overflow-hidden ${
                hasAdminRole
                  ? "shadow shadow-red-500 border border-red-400"
                  : "border-gray-300"
              }`}
            >
              {userImage ? (
                <Image
                  src={userImage}
                  alt={userName}
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="size-5 text-gray-600" />
              )}
            </div>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">{userName}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end">
        {restaurantName && (
          <DropdownMenuLabel className="text-xs font-semibold">
            {restaurantName}
          </DropdownMenuLabel>
        )}
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
