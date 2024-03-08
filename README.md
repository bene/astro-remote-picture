# astro-remote-pictures

This plugin enables you to use dynamic images with the performance benefits of the `<Picture />` and `<Image />` components of Astro.

## Installation

```bash
npm i astro-remote-pictures
```

## Basic example

This example just uses static URLs to demonstrate the basic usage of the plugin. It doesn't make much sense to use this plugin for static URLs, but it's a good starting point to understand how it works. See the dynamic example [below](#dynamic-example).

### Configuration

```javascript filename="astro.config.mjs"
import { defineConfig } from "astro/config";
import remotePictures from "astro-remote-pictures";

export default defineConfig({
  integrations: [
    remotePictures({
      collections: [
        {
          id: "backgrounds",
          pictures: [
            {
              id: "PolarBear",
              url: "https://images.unsplash.com/photo-1709048260183-44acb7826928",
            },
          ],
        },
      ],
    }),
  ],
});
```

### Usage

```astro
---
import { Picture } from "astro:assets";
import { PolarBear } from "astro-remote-pictures/wallpapers";
---

<Picture
  src={PolarBear}
  alt="A polar bear"
/>
```

The `PolarBear` import is a reference to the picture with the ID `PolarBear` from the `backgrounds` collection. The plugin automatically generates these references for you. The import path is always `astro-remote-pictures/$collectionId`.

## Dynamic example

This plugin really starts to make sense once you want to use images dynamically fetched from an CMS or any other API.

### Configuration

```javascript filename="astro.config.mjs"
import { defineConfig } from "astro/config";
import remotePictures, { toPictureId } from "astro-remote-pictures";

// Fetch wallpapers from API
const wallpapers = await fetch(...)

export default defineConfig({
  integrations: [
    remotePictures({
      fetchOptions: {
        headers: {
            "Authorization": "Bearer super_secret_token"
        }
      },
      collections: [
        {
          id: "wallpapers",
          pictures: wallpapers.map(wallpaper => ({
            id: toPictureId(wallpaper.name),
            url: wallpaper.url,
          })),
        },
      ],
    }),
  ],
});
```

### Usage

```astro
---
import { Picture } from "astro:assets";
import { toPictureId } from "astro-remote-pictures";

// Import all pictures from the wallpapers collection
import * as wallpaperRefs from "astro-remote-pictures/wallpapers";

// Fetch wallpapers from API
const wallpapers = fetch(...)
---

{wallpapers.map(wallpaper => (
  <Picture
    src={wallpaperRefs[toPictureId(wallpaper.name)]}
    alt={wallpaper.name}
  />
))}
```
