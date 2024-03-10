import type { AstroIntegration } from "astro";
import { existsSync } from "fs";
import { writeFile } from "fs/promises";

export type RemotePicture = {
  id: string;
  url: string;
};

export type Config = {
  collections: {
    id: string;
    pictures: RemotePicture[];
  }[];
  downloadOptions?: RequestInit;
};

async function fileExists(filePath: string) {
  return existsSync(filePath);
}

async function downloadFile(
  url: string,
  filePath: string,
  options?: RequestInit
) {
  let res: Response;

  try {
    res = await fetch(url, options);
    if (!res.ok) {
      console.error(`Failed to download ${url}: ${res.statusText}`);
      return;
    }
  } catch (error) {
    console.error(`Failed to download ${url}: ${error}`);
    return;
  }

  const buffer = await res.arrayBuffer();
  const view = new DataView(buffer);

  await writeFile(filePath, view);
}

export function createRemoteAssetId(collectionId: string, pictureId: string) {
  return `${collectionId}-${pictureId}`;
}

function crateIntegration(config: Config): AstroIntegration {
  return {
    name: "Remote Assets",
    hooks: {
      "astro:config:setup": async () => {
        for (const collection of config.collections) {
          let remoteAssetsFile = "";
          let typeDefinitions = `import type { ImageMetadata } from "astro";`;

          console.log(`Downloading pictures of ${collection.id}:`);

          for (const picture of collection.pictures) {
            const url = new URL(picture.url);
            const fileType = url.pathname.split(".").pop();

            const filePath = `public/remote/${collection.id}-${picture.id}.${fileType}`;
            const isDownloaded = await fileExists(filePath);

            remoteAssetsFile += `import ${picture.id} from "../../${filePath}"\n`;
            remoteAssetsFile += `export { ${picture.id} }\n`;
            typeDefinitions += `declare const ${picture.id}: ImageMetadata;\n`;

            if (isDownloaded) {
              console.log(`Skipping ${picture.id}`);
              continue;
            }

            console.log(`Downloading ${picture.id}`);
            await downloadFile(picture.url, filePath, config.downloadOptions);
          }

          await writeFile(
            `node_modules/astro-remote-pictures/${collection.id}.js`,
            remoteAssetsFile,
            "utf-8"
          );
          await writeFile(
            `node_modules/astro-remote-pictures/${collection.id}.d.ts`,
            typeDefinitions,
            "utf-8"
          );

          const importLine = `│ import * as ${collection.id} from "astro-remote-pictures/${collection.id}" │`;
          const headerLine = `╭${"─".repeat(importLine.length - 2)}╮`;
          const footerLine = `╰${"─".repeat(importLine.length - 2)}╯\n`;

          if (process.env.MODE === "development") {
            console.log(`Collection ${collection.id} ready to use:`);
            console.log(headerLine);
            console.log(importLine);
            console.log(footerLine);
          }
        }
      },
    },
  };
}

export function toPictureId(name: string) {
  // Step 1: Replace spaces and special characters with underscores
  let identifier = name.replace(/[^a-zA-Z0-9_]/g, "_");

  // Step 2: Ensure it doesn't start with a number
  if (/^\d/.test(identifier)) {
    identifier = "_" + identifier;
  }

  // Step 3: CamelCase the identifier (optional, for readability)
  identifier = identifier
    .split("_")
    .map((part, index) =>
      index === 0
        ? part.toLowerCase()
        : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
    )
    .join("");

  // Step 4: Ensure it doesn't clash with JavaScript reserved keywords
  const reservedKeywords = [
    "break",
    "case",
    "catch",
    "class",
    "const",
    "continue",
    "debugger",
    "default",
    "delete",
    "do",
    "else",
    "export",
    "extends",
    "finally",
    "for",
    "function",
    "if",
    "import",
    "in",
    "instanceof",
    "new",
    "return",
    "super",
    "switch",
    "this",
    "throw",
    "try",
    "typeof",
    "var",
    "void",
    "while",
    "with",
    "yield",
    "let",
    "static",
    "enum",
    "await",
    "implements",
    "package",
    "protected",
    "interface",
    "private",
    "public",
  ];

  if (reservedKeywords.includes(identifier)) {
    identifier = "_" + identifier;
  }

  return identifier;
}

export default crateIntegration;
