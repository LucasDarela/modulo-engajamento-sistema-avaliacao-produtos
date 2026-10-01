import { History, MessagesSquare, Star } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";

const features = [
  {
    icon: Star,
    title: "Dê sua nota",
    description: "Avalie de 1 a 5 estrelas e conte como foi sua experiência.",
  },
  {
    icon: MessagesSquare,
    title: "Leia antes de comprar",
    description: "Veja o que outras pessoas acharam do produto.",
  },
  {
    icon: History,
    title: "Tudo em um só lugar",
    description: "Acompanhe todas as avaliações que você já fez.",
  },
];

// Painel esquerdo das telas de autenticação; só aparece no desktop
export function AuthHero({ title }: { title: string }) {
  return (
    <aside className="relative hidden flex-col justify-between gap-10 overflow-hidden bg-[image:var(--brand-gradient)] p-12 text-white lg:sticky lg:top-0 lg:flex lg:h-screen xl:px-16">
      <BrandLogo tone="light" />

      <div className="max-w-md">
        <p className="text-[2.125rem] leading-[1.15] font-semibold tracking-[-0.03em] text-balance">
          {title}
        </p>
        <ul className="mt-8 space-y-5">
          {features.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <div>
                <p className="font-semibold">{title}</p>
                <p className="mt-0.5 text-[0.9375rem] text-white/70">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Placeholder: substituir por um depoimento real antes de publicar */}
      <figure className="max-w-md border-t border-white/15 pt-6">
        <blockquote className="leading-relaxed text-white/90">
          “Antes de qualquer compra, passo aqui para ver o que as pessoas
          acharam. Já me poupou de muita dor de cabeça.”
        </blockquote>
        <figcaption className="mt-4 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-white/15 text-sm font-semibold"
          >
            CR
          </span>
          <span>
            <span className="block font-medium">Camila R.</span>
            <span className="block text-sm text-white/60">Usuária beta</span>
          </span>
        </figcaption>
      </figure>
    </aside>
  );
}
