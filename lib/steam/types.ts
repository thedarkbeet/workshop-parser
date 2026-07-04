export interface ModEntry {
  /** Steam Workshop published file id (the numeric id from the URL). */
  workshopId: string;
  /** Human readable mod title, when Steam returns it. */
  title: string;
  /** Project Zomboid `Mod ID` values found in the description (can be several). */
  modIds: string[];
  /** True when the item is unavailable (banned, hidden, private, deleted). */
  unavailable: boolean;
}

export interface ParseWarning {
  workshopId: string;
  title: string;
  /** Why this item needs manual attention. */
  reason: "no-mod-id" | "multiple-mod-ids" | "unavailable";
}

export interface ParseResult {
  collectionId: string;
  /** Ordered, de-duplicated list of workshop ids for `WorkshopItems=`. */
  workshopIds: string[];
  /** Ordered, de-duplicated list of mod ids for `Mods=`. */
  modIds: string[];
  /** Per-mod breakdown, in collection order. */
  entries: ModEntry[];
  /** Items that could not be fully resolved and may need a manual check. */
  warnings: ParseWarning[];
}
