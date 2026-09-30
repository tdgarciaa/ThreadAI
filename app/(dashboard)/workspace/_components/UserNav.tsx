"use client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "@/components/ui/button";
import { AvatarImage, Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CreditCardIcon, LogOutIcon, UserIcon } from "lucide-react";
import { LogoutLink, PortalLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { useSuspenseQueries, useSuspenseQuery } from "@tanstack/react-query";
import { orpc } from "@/lib/orpc";
import { getAvatar } from "@/lib/get-avatar";
import Image from "next/image";

export function UserNav() {
  const {
    data: { user },
  } = useSuspenseQuery(orpc.workspace.list.queryOptions());

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="size-12 rounded-xl hover:rounded-lg trasition-all duration-200 bg-background/50 border-border/50 hover:bg-accent hover:text-accent-foreground"
        >
          <Avatar>
            <Image
              src={getAvatar(user.picture, user.email!)}
              alt="User Picture"
              fill
              className="object-cover"
            />
            <AvatarFallback>
              {user.given_name?.slice(0, 2).toLocaleUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="right"
        sideOffset={8}
        className="w-[200px]"
      >
        <DropdownMenuLabel className="font-normal flex items-center gap-2 px-1 py-1.5 text-left text-sm ">
          <Avatar className="relative rounded-lg size-8">
            <AvatarImage
              src={getAvatar(user.picture, user.email!)}
              alt="User image"
              className="object-cover"
            />
            <AvatarFallback>
              {user.given_name?.slice(0, 2).toLocaleUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <p className="truncate font-medium">{user.given_name}</p>
            <p className="truncate text-muted-foreground text-xs">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <PortalLink>
              <UserIcon />
              Acount
            </PortalLink>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <PortalLink>
              <CreditCardIcon />
              Billing
            </PortalLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <LogoutLink>
            <LogOutIcon />
            Log out
          </LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
