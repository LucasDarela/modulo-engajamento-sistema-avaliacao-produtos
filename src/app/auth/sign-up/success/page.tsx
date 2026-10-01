import { cn } from "cn";
import type { Metadata } from "next";
import Link from "next/link";

import { BRAND_NAME, BrandLogo } from "@/components/brand-logo";
import { Confetti } from "@/components/confetti";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Conta criada",
};

export default function SignUpSuccessPage() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center gap-10 bg-[image:var(--brand-gradient)] px-4 py-16">
      <Confetti />

      <BrandLogo tone="light" className="relative z-10" />

      <div className="relative z-10 w-full max-w-md rounded-2xl bg-card px-6 py-10 text-center shadow-2xl shadow-indigo-950/50 sm:px-10">
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className="mx-auto size-16 animate-check-circle motion-reduce:animate-none"
        >
          <circle cx="32" cy="32" r="32" className="fill-primary" />
          <path
            d="M20 33.5l8 8 16-17"
            pathLength={1}
            fill="none"
            stroke="white"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={1}
            className="animate-check-draw motion-reduce:animate-none"
          />
        </svg>

        <h1 className="mt-6 text-3xl leading-tight font-semibold tracking-[-0.025em] text-balance">
          Boas-vindas ao {BRAND_NAME}!
        </h1>
        <p className="mt-3 leading-relaxed text-muted-foreground text-pretty">
          Sua conta foi criada. Entre para começar a avaliar produtos e ver o
          que outras pessoas acharam.
        </p>

        <Link
          href="/auth/sign-in"
          className={cn(
            buttonVariants(),
            "mt-8 h-11 w-full rounded-lg text-base font-semibold shadow-sm shadow-primary/25 hover:bg-primary/90",
          )}
        >
          Ir para o login
        </Link>
      </div>
    </main>
  );
}
