# ImageAlchemy

ImageAlchemy is a private image compression studio for WebP, AVIF, JPEG and PNG. Users can resize a batch, apply per-image settings, compare outputs and download individual files or a ZIP. The free compressor processes images in the browser. The optional Pro website audit uses a separate service.

[Open ImageAlchemy](https://imagealchemy.app/) · [Image optimization guides](https://imagealchemy.app/learn) · [Format guide](https://imagealchemy.app/formats)

## Development

Use Node.js 22.12 or later and npm. From the repository root run:

    npm ci --legacy-peer-deps
    npm run dev

Run the release checks and inspect the static build locally:

    npm test
    npm run lint
    npm run build
    npm run preview

The production build renders each route to its own HTML file, preserves the historical HTML aliases, writes the sitemap and Markdown alternates, and checks link, metadata, structured-data, licence and audit consistency. The deployable frontend is in `dist/`.

## Source map

| Area | Location |
| --- | --- |
| Studio, queue, export and comparison | `src/pages/Index.tsx`, `src/components/`, `src/lib/` |
| Public routes, canonical URLs and schema | `src/seo/` |
| Guides, tools, formats and glossary | `src/content/` |
| Prerendering and release checks | `scripts/`, `plugins/` |
| Optional audit service | `workers/audit-proxy/` |
| Photo and font licences | `public/studio-demo/`, `public/fonts/`, `public/compare/meta.json` |

## Production

The existing imagealchemy.app domain is published through the [Image Alchemy Pro project](https://lovable.dev/projects/049f5486-5bb1-4ae8-a598-0be47c0403e5), connected to [form-beauty-studio](https://github.com/douphealth/form-beauty-studio). The related [image-alchemy-pro repository](https://github.com/douphealth/image-alchemy-pro) shares the studio source. Publish from the connected project and compare the live `/deploy-version.json` with the intended release. Keep the existing production environment settings for the optional audit and checkout. A frontend release does not require a Worker deployment.

To roll back a frontend release, restore the preceding published version in the same project or revert the release commit and republish. Recheck the homepage, an article URL, an export and the Pro page.

## Using the studio

Use the comparison slider and magnification on the sample photograph to inspect a quality setting. **Use WebP Q…** applies that setting to the next batch. **Try a sample** puts the same source photograph through the actual encoder.

A file size target applies to each image independently. The encoder first tries the selected quality. If the result exceeds the target, it tests up to five lower qualities. It reports the measured outcome for each file, including exports that still exceed the target. PNG stays lossless. Reduce the maximum dimension when a target is too small. Auto-Pick excludes JPEG when it finds transparent pixels.

The guide directory accepts searches such as [/learn?q=srcset](https://imagealchemy.app/learn?q=srcset). Every guide also has its own directly addressable HTML document.
