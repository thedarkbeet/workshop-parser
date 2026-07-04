import {
  extractCollectionId,
  fetchCollectionWorkshopIds,
  InvalidInputError,
  SteamRequestError,
} from "./collection";
import { fetchModDetails } from "./mod-details";
import type { ParseProgress, ParseResult, ParseWarning } from "./types";

export { InvalidInputError, SteamRequestError };

/**
 * Full pipeline: collection URL/id -> ordered workshop ids -> mod details ->
 * de-duplicated `WorkshopItems` / `Mods` lists plus manual-check warnings.
 *
 * `onProgress` is invoked as work advances so callers (e.g. a streaming route)
 * can surface a progress bar.
 */
export async function parseCollection(
  input: string,
  onProgress?: (progress: ParseProgress) => void,
): Promise<ParseResult> {
  const collectionId = extractCollectionId(input);
  if (!collectionId) {
    throw new InvalidInputError(
      "Не удалось распознать ссылку на коллекцию. Вставьте URL вида https://steamcommunity.com/sharedfiles/filedetails/?id=... или числовой ID.",
    );
  }

  onProgress?.({
    phase: "collection",
    loaded: 0,
    total: 0,
    message: "Получаем список модов из коллекции…",
  });

  const workshopIds = await fetchCollectionWorkshopIds(collectionId);

  onProgress?.({
    phase: "mods",
    loaded: 0,
    total: workshopIds.length,
    message: `Читаем данные модов (0 из ${workshopIds.length})…`,
  });

  const entries = await fetchModDetails(workshopIds, (loaded, total) => {
    onProgress?.({
      phase: "mods",
      loaded,
      total,
      message: `Читаем данные модов (${loaded} из ${total})…`,
    });
  });

  const modIds: string[] = [];
  const seenModIds = new Set<string>();
  const warnings: ParseWarning[] = [];

  for (const entry of entries) {
    if (entry.unavailable) {
      warnings.push({
        workshopId: entry.workshopId,
        title: entry.title,
        reason: "unavailable",
      });
      continue;
    }

    if (entry.modIds.length === 0) {
      warnings.push({
        workshopId: entry.workshopId,
        title: entry.title,
        reason: "no-mod-id",
      });
    } else if (entry.modIds.length > 1) {
      warnings.push({
        workshopId: entry.workshopId,
        title: entry.title,
        reason: "multiple-mod-ids",
      });
    }

    for (const modId of entry.modIds) {
      if (!seenModIds.has(modId)) {
        seenModIds.add(modId);
        modIds.push(modId);
      }
    }
  }

  return {
    collectionId,
    workshopIds,
    modIds,
    entries,
    warnings,
  };
}
