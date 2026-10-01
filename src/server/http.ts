import "server-only";

function errorResponse(code: string, message: string, status: number) {
  return Response.json({ error: { code, message } }, { status });
}

// Lê o body JSON dos route handlers REST. Exigir application/json impede que um
// <form enctype="text/plain"> de outro site dispare o POST (ex.: login CSRF).
export async function readJsonBody(
  req: Request,
): Promise<{ body: unknown; error?: never } | { error: Response }> {
  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    return {
      error: errorResponse(
        "UNSUPPORTED_MEDIA_TYPE",
        "Envie o body como application/json.",
        415,
      ),
    };
  }

  try {
    return { body: await req.json() };
  } catch {
    return {
      error: errorResponse("BAD_REQUEST", "Body deve ser um JSON válido.", 400),
    };
  }
}
