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
  fetchOptions?: RequestInit;
};

async function fileExists(filePath: string) {
  return existsSync(filePath);
}

async function downloadFile(
  url: string,
  filePath: string,
  options?: RequestInit
) {
  const res = await fetch(url, options);
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
          console.log(`Downloading pictures of ${collection.id}:`);

          for (let i = 0; i < collection.pictures.length; i++) {
            const picture = collection.pictures[i];
            const assetId = `asset${i}`;
            const url = new URL(picture.url);
            const fileType = url.pathname.split(".").pop();

            const filePath = `public/remote/${collection.id}-${picture.id}.${fileType}`;
            const isDownloaded = await fileExists(filePath);

            remoteAssetsFile += `import ${assetId} from "../../${filePath}"\n`;
            remoteAssetsFile += `export { ${assetId} as ${picture.id} }\n`;

            if (isDownloaded) {
              console.log(`Skipping ${picture.id}`);
              continue;
            }

            console.log(`Downloading ${picture.id}`);
            await downloadFile(picture.url, filePath, config.fetchOptions);
          }

          await writeFile(
            `node_modules/astro-remote-pictures/${collection.id}.js`,
            remoteAssetsFile,
            "utf-8"
          );
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
