import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthHero } from "@/components/auth-hero";
import { BrandLogo } from "@/components/brand-logo";
import { getSession } from "@/server/session";

import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function SignInPage() {
  if (await getSession()) redirect("/");

  return (
    <main className="flex flex-1 lg:grid lg:min-h-screen lg:grid-cols-2">
      <AuthHero title="Suas avaliações continuam aqui. Falta só você entrar." />

      <section className="flex flex-1 flex-col px-4 py-10 sm:px-8 lg:justify-center lg:py-12">
        <div className="mx-auto w-full max-w-[400px]">
          <BrandLogo className="mb-12 lg:hidden" />
          <h1 className="text-3xl leading-tight font-semibold tracking-[-0.025em]">
            Entre na sua conta
          </h1>
          <p className="mt-2 text-muted-foreground">
            Use o email e a senha que você cadastrou.
          </p>
          <SignInForm />
        </div>
      </section>
    </main>
  );
}
