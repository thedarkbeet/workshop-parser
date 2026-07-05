import antfu from "@antfu/eslint-config";

export default antfu(
  {
    type: "app",
    nextjs: true,
    typescript: true,
    formatters: true,
    stylistic: {
      indent: 2,
      semi: true,
      quotes: "double",
    },
  },
  {
    rules: {
      "ts/no-redeclare": "off",
      "ts/consistent-type-definitions": ["error", "type"],
      "no-console": ["warn"],
      "antfu/no-top-level-await": ["off"],
      "node/prefer-global/process": ["off"],
      "node/no-process-env": ["error"],
      "perfectionist/sort-imports": [
        "error",
        {
          tsconfig: {
            rootDir: ".",
          },
        },
      ],
      "unicorn/filename-case": [
        "error",
        {
          case: "kebabCase",
          ignore: ["README.md", "node_modules", "LICENSE", ".pnpm-store"],
        },
      ],
    },
  },
  {
    files: ["lib/env/**/*.ts", "lib/db/**/*.ts", "prisma/**/*.ts"],
    rules: {
      "node/no-process-env": "off",
    },
  },
);
