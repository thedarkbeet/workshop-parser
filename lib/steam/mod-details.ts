import { SteamRequestError } from "./collection";
import type { ModEntry } from "./types";

const PUBLISHED_FILE_DETAILS_URL =
  "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/";

const STEAM_RESULT_OK = 1;
/** Steam caps a single GetPublishedFileDetails call; stay comfortably under it. */
const BATCH_SIZE = 50;

interface PublishedFileDetail {
  publishedfileid: string;
  result: number;
  title?: string;
  description?: string;
}

interface PublishedFileDetailsResponse {
  response?: {
    publishedfiledetails?: PublishedFileDetail[];
  };
}

/**
 * Extracts Project Zomboid `Mod ID` values from a workshop description.
 * A single mod can declare several ids, and authors sometimes wrap them in
 * BBCode, so tags are stripped and blank values dropped.
 */
export function extractModIds(description: string): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const pattern = /Mod\s*ID\s*:\s*(.+)/gi;

  let match: RegExpExecArray | null;
  while ((match = pattern.exec(description)) !== null) {
    const value = match[1]
      .replace(/\[[^\]]*\]/g, "") // strip BBCode like [b] / [/b]
      .split(/[\r\n]/)[0]
      .trim();

    if (value && !seen.has(value)) {
      seen.add(value);
      ids.push(value);
    }
  }

  return ids;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function requestPublishedFileDetails(
  ids: string[],
): Promise<PublishedFileDetail[]> {
  const body = new URLSearchParams();
  body.set("itemcount", String(ids.length));
  ids.forEach((id, index) => body.set(`publishedfileids[${index}]`, id));

  let res: Response;
  try {
    res = await fetch(PUBLISHED_FILE_DETAILS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    });
  } catch (cause) {
    throw new SteamRequestError("Не удалось связаться со Steam.", { cause });
  }

  if (!res.ok) {
    throw new SteamRequestError(`Steam вернул статус ${res.status}.`);
  }

  const data = (await res.json()) as PublishedFileDetailsResponse;
  return data.response?.publishedfiledetails ?? [];
}

/**
 * Fetches details for each workshop id and maps them into `ModEntry` records,
 * preserving the incoming order. Requests are batched to keep the number of
 * round-trips small for large collections.
 */
export async function fetchModDetails(
  workshopIds: string[],
): Promise<ModEntry[]> {
  const byId = new Map<string, PublishedFileDetail>();

  for (const batch of chunk(workshopIds, BATCH_SIZE)) {
    const details = await requestPublishedFileDetails(batch);
    for (const detail of details) {
      byId.set(detail.publishedfileid, detail);
    }
  }

  return workshopIds.map((workshopId) => {
    const detail = byId.get(workshopId);
    const unavailable = !detail || detail.result !== STEAM_RESULT_OK;

    return {
      workshopId,
      title: detail?.title?.trim() || workshopId,
      modIds: detail?.description ? extractModIds(detail.description) : [],
      unavailable,
    } satisfies ModEntry;
  });
}
