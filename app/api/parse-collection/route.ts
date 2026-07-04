import {
  InvalidInputError,
  parseCollection,
  SteamRequestError,
} from "@/lib/steam/parse";

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

  try {
    const result = await parseCollection(body.url);
    return Response.json(result);
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return Response.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof SteamRequestError) {
      return Response.json({ error: error.message }, { status: 502 });
    }

    console.error("Unexpected error while parsing collection", error);
    return Response.json(
      { error: "Непредвиденная ошибка при обработке коллекции." },
      { status: 500 },
    );
  }
}
