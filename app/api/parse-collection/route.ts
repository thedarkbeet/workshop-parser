import {
  InvalidInputError,
  parseCollection,
  SteamRequestError,
} from "@/lib/steam/parse";
import type { ParseStreamEvent } from "@/lib/steam/types";

export const runtime = "nodejs";

interface ParseRequestBody {
  url?: unknown;
}

export async function POST(request: Request) {
  let body: ParseRequestBody;
  try {
    body = (await request.json()) as ParseRequestBody;
  } catch {
    return Response.json(
      { error: "Ожидался JSON с полем `url`." },
      { status: 400 },
    );
  }

  if (typeof body.url !== "string" || body.url.trim() === "") {
    return Response.json(
      { error: "Укажите ссылку на коллекцию Steam Workshop." },
      { status: 400 },
    );
  }

  const url = body.url;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ParseStreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        const result = await parseCollection(url, (progress) =>
          send({ type: "progress", progress }),
        );
        send({ type: "result", result });
      } catch (error) {
        if (
          error instanceof InvalidInputError ||
          error instanceof SteamRequestError
        ) {
          send({ type: "error", error: error.message });
        } else {
          console.error("Unexpected error while parsing collection", error);
          send({
            type: "error",
            error: "Непредвиденная ошибка при обработке коллекции.",
          });
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
