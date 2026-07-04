"use client";

import { useCallback, useState } from "react";
import type { ParseResult, ParseWarning } from "@/lib/steam/types";

const WARNING_LABELS: Record<ParseWarning["reason"], string> = {
  "no-mod-id": "Mod ID не найден в описании — проверьте страницу мода вручную",
  "multiple-mod-ids": "Несколько Mod ID — выберите нужные",
  unavailable: "Мод недоступен (скрыт, забанен или удалён)",
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }, [value]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
    >
      {copied ? "Скопировано" : label}
    </button>
  );
}

function ResultBlock({
  title,
  configKey,
  values,
}: {
  title: string;
  configKey: string;
  values: string[];
}) {
  const joined = values.join(";");
  const configLine = `${configKey}=${joined}`;

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {title}{" "}
          <span className="font-normal text-zinc-500">({values.length})</span>
        </h3>
        <div className="flex gap-2">
          <CopyButton value={joined} label="Копировать список" />
          <CopyButton value={configLine} label={`Копировать ${configKey}=`} />
        </div>
      </div>
      <textarea
        readOnly
        value={joined}
        rows={4}
        className="w-full resize-y rounded-md border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-zinc-800 dark:border-zinc-800 dark:bg-black dark:text-zinc-200"
      />
    </section>
  );
}

export function CollectionParser() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ParseResult | null>(null);

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (loading || url.trim() === "") return;

      setLoading(true);
      setError(null);
      setResult(null);

      try {
        const res = await fetch("/api/parse-collection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error ?? "Не удалось обработать коллекцию.");
          return;
        }

        setResult(data as ParseResult);
      } catch {
        setError("Сетевая ошибка. Попробуйте ещё раз.");
      } finally {
        setLoading(false);
      }
    },
    [loading, url],
  );

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label
          htmlFor="collection-url"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Ссылка на коллекцию Steam Workshop
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="collection-url"
            type="text"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://steamcommunity.com/sharedfiles/filedetails/?id=..."
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={loading || url.trim() === ""}
            className="rounded-lg bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {loading ? "Обработка…" : "Разобрать"}
          </button>
        </div>
      </form>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <div className="flex flex-col gap-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Коллекция{" "}
            <span className="font-mono">{result.collectionId}</span>: найдено{" "}
            {result.entries.length} модов, {result.modIds.length} Mod ID.
          </p>

          <div className="grid gap-4">
            <ResultBlock
              title="Workshop ID"
              configKey="WorkshopItems"
              values={result.workshopIds}
            />
            <ResultBlock
              title="Mod ID"
              configKey="Mods"
              values={result.modIds}
            />
          </div>

          {result.warnings.length > 0 && (
            <section className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
              <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">
                Требуют проверки ({result.warnings.length})
              </h3>
              <ul className="flex flex-col gap-1 text-sm text-amber-800 dark:text-amber-200">
                {result.warnings.map((warning) => (
                  <li key={`${warning.workshopId}-${warning.reason}`}>
                    <a
                      href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${warning.workshopId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium underline"
                    >
                      {warning.title}
                    </a>{" "}
                    — {WARNING_LABELS[warning.reason]}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                <tr>
                  <th className="px-4 py-2 font-medium">Мод</th>
                  <th className="px-4 py-2 font-medium">Workshop ID</th>
                  <th className="px-4 py-2 font-medium">Mod ID</th>
                </tr>
              </thead>
              <tbody>
                {result.entries.map((entry) => (
                  <tr
                    key={entry.workshopId}
                    className="border-t border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="px-4 py-2 text-zinc-900 dark:text-zinc-100">
                      <a
                        href={`https://steamcommunity.com/sharedfiles/filedetails/?id=${entry.workshopId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {entry.title}
                      </a>
                    </td>
                    <td className="px-4 py-2 font-mono text-zinc-600 dark:text-zinc-400">
                      {entry.workshopId}
                    </td>
                    <td className="px-4 py-2 font-mono text-zinc-600 dark:text-zinc-400">
                      {entry.unavailable ? (
                        <span className="text-red-500">недоступен</span>
                      ) : entry.modIds.length > 0 ? (
                        entry.modIds.join(", ")
                      ) : (
                        <span className="text-amber-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}
    </div>
  );
}
