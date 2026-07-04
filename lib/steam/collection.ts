const COLLECTION_DETAILS_URL =
  "https://api.steampowered.com/ISteamRemoteStorage/GetCollectionDetails/v1/";

const STEAM_RESULT_OK = 1;
/** Steam `EWorkshopFileType`: a child that is itself a collection. */
const FILETYPE_COLLECTION = 2;

interface CollectionChild {
  publishedfileid: string;
  filetype: number;
}

interface CollectionDetail {
  publishedfileid: string;
  result: number;
  children?: CollectionChild[];
}

interface CollectionDetailsResponse {
  response?: {
    result?: number;
    collectiondetails?: CollectionDetail[];
  };
}

/** Upstream (Steam) failure or missing data — surfaced as a 502. */
export class SteamRequestError extends Error {}

/** Bad user input (e.g. an unrecognizable URL) — surfaced as a 400. */
export class InvalidInputError extends Error {}

/**
 * Accepts a full Steam collection URL or a bare numeric id and returns the
 * collection id, or `null` when no id can be found.
 */
export function extractCollectionId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d+$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("id");
    if (fromQuery && /^\d+$/.test(fromQuery)) return fromQuery;
  } catch {
    // Not a URL, fall through to the loose match below.
  }

  const match = trimmed.match(/(?:[?&]id=)(\d+)/);
  return match ? match[1] : null;
}

async function requestCollectionDetails(
  ids: string[],
): Promise<CollectionDetail[]> {
  const body = new URLSearchParams();
  body.set("collectioncount", String(ids.length));
  ids.forEach((id, index) => body.set(`publishedfileids[${index}]`, id));

  let res: Response;
  try {
    res = await fetch(COLLECTION_DETAILS_URL, {
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

  const data = (await res.json()) as CollectionDetailsResponse;
  return data.response?.collectiondetails ?? [];
}

/**
 * Resolves a collection id into an ordered, de-duplicated list of workshop item
 * ids. Nested collections are followed recursively so that arbitrarily deep
 * collections are fully expanded.
 */
export async function fetchCollectionWorkshopIds(
  collectionId: string,
): Promise<string[]> {
  const workshopIds: string[] = [];
  const seenItems = new Set<string>();
  const visitedCollections = new Set<string>();

  let frontier = [collectionId];

  while (frontier.length > 0) {
    const toQuery = frontier.filter((id) => !visitedCollections.has(id));
    toQuery.forEach((id) => visitedCollections.add(id));
    if (toQuery.length === 0) break;

    const details = await requestCollectionDetails(toQuery);
    const nextFrontier: string[] = [];

    for (const detail of details) {
      if (detail.result !== STEAM_RESULT_OK || !detail.children) continue;

      for (const child of detail.children) {
        const childId = child.publishedfileid;

        if (child.filetype === FILETYPE_COLLECTION) {
          if (!visitedCollections.has(childId)) nextFrontier.push(childId);
          continue;
        }

        if (!seenItems.has(childId)) {
          seenItems.add(childId);
          workshopIds.push(childId);
        }
      }
    }

    frontier = nextFrontier;
  }

  if (workshopIds.length === 0) {
    throw new SteamRequestError(
      "Коллекция не найдена или пуста. Проверьте ссылку и что коллекция публичная.",
    );
  }

  return workshopIds;
}
