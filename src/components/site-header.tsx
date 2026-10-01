import { cn } from "cn";
import Link from "next/link";

import { BRAND_NAME, BrandLogo } from "@/components/brand-logo";
import { buttonVariants } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { getSession } from "@/server/session";

export async function SiteHeader() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label={`${BRAND_NAME}, página inicial`}
          className="rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <BrandLogo />
        </Link>

        {session ? (
          <UserMenu
            firstName={session.firstName}
            lastName={session.lastName}
            email={session.email}
          />
        ) : (
          <Link
            href="/auth/sign-in"
            className={cn(
              buttonVariants(),
              "h-9 rounded-lg px-4 text-[0.9375rem] font-semibold shadow-sm shadow-primary/25 hover:bg-primary/90",
            )}
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
