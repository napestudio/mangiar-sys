"use client";

import { UserRole } from "@/app/generated/prisma";
import { isAdminOrHigher } from "@/lib/permissions/role-utils";
import { KeyRound, User } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { SignOutButton } from "./sign-out-button";
import { ChangePasswordDialog } from "./users/change-password-dialog";

interface UserDropdownProps {
  userName: string;
  userRole: UserRole | null;
  userImage?: string | null;
  restaurantName?: string | null;
  userId: string;
}

export default function UserDropdown({
  userName,
  userRole,
  userImage: initialUserImage,
  restaurantName,
  userId,
}: UserDropdownProps) {
  const hasAdminRole = isAdminOrHigher(userRole);
  const [userImage] = useState<string | null>(initialUserImage ?? null);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  // userId kept for future use (e.g., profile editing)
  void userId;

  return (
    <>
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
            onSelect={() => setChangePasswordOpen(true)}
            className="cursor-pointer"
          >
            <KeyRound className="size-4 mr-2" />
            Cambiar contraseña
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <SignOutButton />
        </DropdownMenuContent>
      </DropdownMenu>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </>
  );
}
