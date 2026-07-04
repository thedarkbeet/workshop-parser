import { CollectionParser } from "@/components/collection-parser";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-16 sm:px-10">
        <header className="flex flex-col gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Парсер коллекций Workshop
          </h1>
          <p className="max-w-xl text-base leading-7 text-zinc-600 dark:text-zinc-400">
            Вставьте ссылку на коллекцию Steam Workshop для Project Zomboid.
            Инструмент соберёт{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Workshop ID
            </span>{" "}
            и{" "}
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              Mod ID
            </span>{" "}
            для всех модов и подготовит готовые списки для конфига сервера.
          </p>
        </header>

        <CollectionParser />
      </main>
    </div>
  );
}
