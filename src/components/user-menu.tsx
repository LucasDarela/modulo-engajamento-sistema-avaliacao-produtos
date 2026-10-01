"use client";

import { useMutation } from "@tanstack/react-query";
import { ChevronDown, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTRPC } from "@/trpc/client";

type UserMenuProps = {
  firstName: string;
  lastName: string;
  email: string;
};

function Avatar({ name, className }: { name: string; className: string }) {
  const src = `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name)}&fontSize=40&fontWeight=600&backgroundType=gradientLinear&backgroundColor=4f46e5,7c3aed`;
  return (
    // biome-ignore lint/performance/noImgElement: SVG externo do Dicebear; next/image exigiria dangerouslyAllowSVG
    <img
      src={src}
      alt=""
      width={36}
      height={36}
      className={className}
      referrerPolicy="no-referrer"
    />
  );
}

export function UserMenu({ firstName, lastName, email }: UserMenuProps) {
  const router = useRouter();
  const trpc = useTRPC();
  const fullName = `${firstName} ${lastName}`;

  const signOut = useMutation(
    trpc.auth.signOut.mutationOptions({
      onSuccess: () => router.refresh(),
    }),
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Menu da conta de ${fullName}`}
        className="group flex min-w-0 items-center gap-3 rounded-full py-1 pr-2 pl-1 transition-colors outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-muted sm:rounded-xl sm:pr-3"
      >
        <Avatar
          name={fullName}
          className="size-9 shrink-0 rounded-full ring-2 ring-background"
        />
        <span className="min-w-0 text-left leading-tight">
          <span className="block max-w-36 truncate text-sm font-semibold sm:max-w-56">
            {fullName}
          </span>
          <span className="hidden max-w-56 truncate text-[0.8125rem] text-muted-foreground sm:block">
            {email}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-data-popup-open:rotate-180 motion-reduce:transition-none"
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-64 rounded-xl p-1.5"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-3 px-2 py-2 text-foreground">
            <Avatar name={fullName} className="size-10 shrink-0 rounded-full" />
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-sm font-semibold">
                {fullName}
              </span>
              <span className="block truncate text-[0.8125rem] font-normal text-muted-foreground">
                {email}
              </span>
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          onClick={() => signOut.mutate()}
          className="gap-2.5 px-2 py-2"
        >
          <LogOut className="text-muted-foreground" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
