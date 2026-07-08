import { getTranslations, setRequestLocale } from "next-intl/server";

import { CollectionParser } from "@/components/collection-parser";

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-[920px] flex-1 flex-col gap-8 px-8 py-16 sm:px-14 lg:px-20">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("heading")}
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            {t.rich("intro", {
              b: chunks => (
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {chunks}
                </span>
              ),
            })}
          </p>
        </header>

        <CollectionParser />
        <footer className="mt-auto flex justify-between gap-4 border-t border-zinc-200 pt-[18px] font-mono text-[10px] text-zinc-500">
          <span>© 2026 Serhii Buriak</span>
          <a

            href="https://github.com/thedarkbeet/workshop-parser"

            target="_blank"

            rel="noopener noreferrer"

            className="group flex items-center gap-1 transition-colors hover:text-zinc-400"
          >

            <span>Found it useful? Leave a</span>

            <span className="transition-transform duration-200 group-hover:scale-110">

              ⭐

            </span>

            <span>on GitHub</span>

          </a>
        </footer>
      </main>
    </div>
  );
}
