import { createTranslator, hasLocale } from "next-intl";
import {
  InvalidInputError,
  parseCollection,
  SteamRequestError,
} from "@/lib/steam/parse";
import type { ParseStreamEvent, SteamTranslator } from "@/lib/steam/types";
import { loadMessages } from "@/i18n/messages";
import { routing, type Locale } from "@/i18n/routing";

export const runtime = "nodejs";

interface ParseRequestBody {
  url?: unknown;
  locale?: unknown;
}

function resolveLocale(value: unknown): Locale {
  return typeof value === "string" && hasLocale(routing.locales, value)
    ? value
    : routing.defaultLocale;
}

async function getTranslators(locale: Locale) {
  const messages = await loadMessages(locale);
  return {
    api: createTranslator({ locale, messages, namespace: "api" }),
    steam: createTranslator({
      locale,
      messages,
      namespace: "steam",
    }) as unknown as SteamTranslator,
  };
}

export async function POST(request: Request) {
  let body: ParseRequestBody;
  try {
    body = (await request.json()) as ParseRequestBody;
  } catch {
    const { api } = await getTranslators(routing.defaultLocale);
    return Response.json({ error: api("expectedJson") }, { status: 400 });
  }

  const locale = resolveLocale(body.locale);
  const { api, steam } = await getTranslators(locale);

  if (typeof body.url !== "string" || body.url.trim() === "") {
    return Response.json({ error: api("missingUrl") }, { status: 400 });
  }

  const url = body.url;
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ParseStreamEvent) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      };

      try {
        const result = await parseCollection(url, steam, (progress) =>
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
          send({ type: "error", error: steam("unexpected") });
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
