import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { z } from "zod";

import type { FeedbackFieldsInput } from "@/lib/validation/feedback";
import { readJsonBody } from "@/server/http";
import { createCaller } from "@/server/routers/_app";
import { createContext } from "@/server/trpc";

function errorResponse(error: unknown) {
  if (!(error instanceof TRPCError)) throw error;

  const isValidation = error.cause instanceof z.ZodError;
  return Response.json(
    {
      error: {
        code: error.code,
        message: isValidation ? "Dados inválidos." : error.message,
        ...(isValidation && {
          fieldErrors: z.flattenError(error.cause).fieldErrors,
        }),
      },
    },
    { status: getHTTPStatusCodeFromError(error) },
  );
}

// Lista pública das avaliações do produto (array vazio se não houver)
export async function GET(
  _req: Request,
  ctx: RouteContext<"/api/v1/products/[id]/feedbacks">,
) {
  const { id } = await ctx.params;
  try {
    const caller = createCaller(await createContext());
    const product = await caller.products.byId({ id });
    if (!product) {
      return Response.json(
        { error: { code: "NOT_FOUND", message: "Produto não encontrado." } },
        { status: 404 },
      );
    }
    const feedbacks = await caller.feedbacks.listByProduct({ productId: id });
    return Response.json(feedbacks, { status: 200 });
  } catch (error) {
    return errorResponse(error);
  }
}

// Contrato REST da spec, delegando para a mesma procedure tRPC usada pelo front
export async function POST(
  req: Request,
  ctx: RouteContext<"/api/v1/products/[id]/feedbacks">,
) {
  const { id } = await ctx.params;

  const parsed = await readJsonBody(req);
  if (parsed.error) return parsed.error;
  const { body } = parsed;

  try {
    // O body é validado pelo zod dentro da procedure; o id vem da URL
    const fields = (body ?? {}) as FeedbackFieldsInput;
    const feedback = await createCaller(await createContext()).feedbacks.create(
      { score: fields.score, comment: fields.comment, productId: id },
    );
    return Response.json(feedback, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
