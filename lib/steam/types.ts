export type ModEntry = {
  /** Steam Workshop published file id (the numeric id from the URL). */
  workshopId: string;
  /** Human readable mod title, when Steam returns it. */
  title: string;
  /** Project Zomboid `Mod ID` values found in the description (can be several). */
  modIds: string[];
  /** True when the item is unavailable (banned, hidden, private, deleted). */
  unavailable: boolean;
};

export type ParseWarning = {
  workshopId: string;
  title: string;
  /** Why this item needs manual attention. */
  reason: "no-mod-id" | "multiple-mod-ids" | "unavailable";
};

export type ParseResult = {
  collectionId: string;
  /** Ordered, de-duplicated list of workshop ids for `WorkshopItems=`. */
  workshopIds: string[];
  /** Ordered, de-duplicated list of mod ids for `Mods=`. */
  modIds: string[];
  /** Per-mod breakdown, in collection order. */
  entries: ModEntry[];
  /** Items that could not be fully resolved and may need a manual check. */
  warnings: ParseWarning[];
};

/** Progress stages reported while a collection is being parsed. */
export type ParsePhase = "collection" | "mods";

export type ParseProgress = {
  phase: ParsePhase;
  /** Items processed so far (0 while the total is still unknown). */
  loaded: number;
  /** Total items to process (0 while still unknown, e.g. during resolving). */
  total: number;
  /** Human readable status for the UI. */
  message: string;
};

/**
 * One line of the NDJSON stream returned by the parse endpoint: either an
 * incremental progress update, the final result, or a terminal error.
 */
export type ParseStreamEvent
  = | { type: "progress"; progress: ParseProgress }
    | { type: "result"; result: ParseResult }
    | { type: "error"; error: string };

/** Localizable message keys produced while parsing a collection. */
export type SteamMessageKey
  = | "progressCollection"
    | "progressMods"
    | "invalidUrl"
    | "collectionNotFound"
    | "contactFailed"
    | "statusError"
    | "unexpected";

/**
 * Minimal translator contract used by the Steam pipeline so that `lib/steam`
 * stays decoupled from any specific i18n library. Callers pass a function that
 * resolves a message key (and optional ICU values) to a localized string.
 */
export type SteamTranslator = (
  key: SteamMessageKey,
  values?: Record<string, string | number>,
) => string;
