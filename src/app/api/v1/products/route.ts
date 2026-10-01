import { TRPCError } from "@trpc/server";
import { getHTTPStatusCodeFromError } from "@trpc/server/http";
import { z } from "zod";

import type { ProductSort } from "@/lib/product-sort";
import type { CreateProductInput } from "@/lib/validation/products";
import { createCaller } from "@/server/routers/_app";
import { isValidApiKey } from "@/server/routers/products";
import { createContext } from "@/server/trpc";

// O REST usa snake_case; as procedures tRPC usam camelCase
const REST_FIELD_NAMES: Record<string, string> = {
  externalLink: "external_link",
  imageUrl: "image",
};

function errorResponse(
  status: number,
  code: string,
  message: string,
  fieldErrors?: Record<string, string[] | undefined>,
) {
  return Response.json(
    { error: { code, message, ...(fieldErrors && { fieldErrors }) } },
    { status },
  );
}

function trpcErrorResponse(error: TRPCError) {
  if (error.cause instanceof z.ZodError) {
    const { fieldErrors } = z.flattenError(error.cause);
    const restFieldErrors = Object.fromEntries(
      Object.entries(fieldErrors as Record<string, string[]>).map(
        ([key, value]) => [REST_FIELD_NAMES[key] ?? key, value],
      ),
    );
    return errorResponse(
      400,
      "BAD_REQUEST",
      "Dados inválidos.",
      restFieldErrors,
    );
  }
  return errorResponse(
    getHTTPStatusCodeFromError(error),
    error.code,
    error.message,
  );
}

// GET /api/v1/products?sort=&cursor=&limit= → { items, nextCursor }
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = searchParams.get("limit");

  try {
    const page = await createCaller(await createContext()).products.list({
      cursor: searchParams.get("cursor") || undefined,
      // Valor inválido é rejeitado pelo zod com 400
      sort: (searchParams.get("sort") || undefined) as ProductSort | undefined,
      // Number("abc") vira NaN e é rejeitado pelo zod
      limit: limit === null ? undefined : Number(limit),
    });
    return Response.json(page);
  } catch (error) {
    if (!(error instanceof TRPCError)) throw error;
    return trpcErrorResponse(error);
  }
}

// POST /api/v1/products (exige x-api-key) { name, external_link | url, image, description? }
// Aceita `url` porque é o campo enviado pelo scraper da Amazon (n8n)
export async function POST(req: Request) {
  if (!isValidApiKey(req.headers.get("x-api-key"))) {
    return errorResponse(
      401,
      "UNAUTHORIZED",
      "Chave de API ausente ou inválida.",
    );
  }

  let body: Record<string, unknown>;
  try {
    const json: unknown = await req.json();
    if (typeof json !== "object" || json === null || Array.isArray(json)) {
      throw new Error("Body não é um objeto");
    }
    body = json as Record<string, unknown>;
  } catch {
    return errorResponse(
      400,
      "BAD_REQUEST",
      "Body deve ser um objeto JSON válido.",
    );
  }

  try {
    // O body é validado pelo zod dentro da procedure
    const product = await createCaller(await createContext()).products.create({
      name: body.name,
      description: body.description,
      externalLink: body.external_link ?? body.url,
      imageUrl: body.image,
    } as CreateProductInput);
    return Response.json(product, { status: 201 });
  } catch (error) {
    if (!(error instanceof TRPCError)) throw error;
    return trpcErrorResponse(error);
  }
}
