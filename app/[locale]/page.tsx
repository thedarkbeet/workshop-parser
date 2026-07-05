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
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:px-10">
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
      </main>
    </div>
  );
}
