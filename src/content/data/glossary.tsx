import { type ReactNode } from "react";
import type { ContentEntry } from "../types";

const P = (children: ReactNode) => <p>{children}</p>;

export const GLOSSARY_CONTENT: Record<string, ContentEntry> = {
  "/glossary/avif": {
    path: "/glossary/avif",
    h1: "AVIF (AV1 Image File Format)",
    lede: "A modern, royalty-free image format based on the AV1 video codec — the best compression of any web image format.",
    keywords: ["avif", "av1 image file format", "image format", "image compression"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>AVIF (AV1 Image File Format) is an image format that encodes still images using the AV1 video codec. It supports lossy and lossless compression, an alpha channel for transparency, animation, 12-bit color depth and wide color gamuts, and produces the smallest files of any current web image format.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>At matched visual quality, AVIF files are roughly <strong>50–60%</strong> the size of JPEG and <strong>80%</strong> the size of WebP. Supported in Chrome, Firefox, Safari 16.4+ and Edge — over 96% of browsers in 2026. Its encoder is slower than WebP's, which is why batch tools run it in background workers.</>)] },
      { id: "what-it-does-well", heading: "What AVIF is unusually good at", body: [
        P(<>Two things separate AVIF from WebP in practice, and both matter more than the headline percentage.</>),
        P(<><strong>Gradients and low-light areas.</strong> Because AV1 was designed for video, it handles smooth tonal transitions well. A photograph with a sky gradient, a soft studio backdrop or dim interior lighting is where AVIF's advantage is most visible — those are exactly the regions where JPEG shows banding at small file sizes.</>),
        P(<><strong>Small files at low quality.</strong> AVIF stays usable at quality settings that would visibly damage a JPEG. Where JPEG starts smearing fine detail below roughly quality 60, AVIF remains acceptable considerably lower, which is why AVIF is the format to reach for when a file budget is genuinely tight.</>),
      ]},
      { id: "where-it-falls-short", heading: "Where AVIF falls short", body: [
        P(<>It is not the right answer for every image, and the trade-offs are worth knowing before you convert a whole site.</>),
        P(<><strong>Encoding is slow.</strong> AVIF can take several times longer to encode than WebP for the same image. On a website that generates variants on demand this becomes a real cost; for a one-off batch it is a few extra seconds.</>),
        P(<><strong>Very small images can get larger.</strong> AVIF carries more format overhead than JPEG. On tiny images — a 40×40 icon, a small favicon — the overhead can outweigh the compression gain and the AVIF ends up bigger than the original. Below roughly a few kilobytes, check the output rather than assuming.</>),
        P(<><strong>It is not a lossless champion.</strong> For flat-colour graphics and screenshots, PNG with proper optimisation or WebP lossless is usually the better choice. AVIF's strength is lossy photographic compression.</>),
      ]},
    ],
    faqs: [
      { question: "What does AVIF stand for?", answer: "AV1 Image File Format. It encodes still images using the AV1 video codec, which is why it achieves better compression than older image formats." },
      { question: "Is AVIF free to use?", answer: "Yes. AVIF is royalty-free and open, backed by the Alliance for Open Media. There are no licensing fees for encoding or decoding." },
      { question: "What browsers support AVIF?", answer: "Chrome, Firefox, Safari 16.4 and later, Edge, and all modern mobile browsers — over 96% of global traffic in 2026. A WebP or JPEG fallback inside a <picture> element covers the remainder." },
      { question: "When should I not use AVIF?", answer: "Three cases: very small images (under a few kilobytes), where AVIF's format overhead can make the file larger than the JPEG it replaces; flat-colour graphics, logos and screenshots, where PNG or WebP lossless is more suitable; and any pipeline that re-encodes on demand, because AVIF encoding is slow enough to become a real cost." },
      { question: "Is AVIF always smaller than WebP?", answer: "For photographs at matched visual quality, yes — typically around 20% smaller. The exception is very small images, where AVIF's greater format overhead can make it larger. Always compare the actual output for images under a few kilobytes." },
    ],
    related: [
      { path: "/formats/avif", label: "AVIF compressor" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/glossary/webp", label: "What is WebP?" },
    ],
  },

  "/glossary/webp": {
    path: "/glossary/webp",
    h1: "WebP",
    lede: "Google's web image format — lossy, lossless, transparency and animation in one file, 25–35% smaller than JPEG and PNG.",
    keywords: ["webp", "image format", "google image format", "image compression"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>WebP is an image format developed by Google, based on the VP8 video codec. It supports lossy compression, lossless compression, transparency (alpha channel) and animation within a single format, effectively replacing JPEG, PNG and animated GIF for web use.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>At matched visual quality, WebP files are roughly <strong>25–35% smaller</strong> than JPEG and 20–30% smaller than PNG lossless. Universally supported since around 2020. It's the pragmatic default format for web images when AVIF isn't available.</>)] },
      { id: "why-it-won", heading: "Why it became the default", body: [
        P(<>WebP succeeded where earlier format attempts failed, and the reasons explain when to keep using it.</>),
        P(<><strong>It replaces three formats at once.</strong> Before WebP, a site needed JPEG for photographs, PNG for transparency, and GIF for animation. WebP covers all three in a single format — one conversion path, one set of fallbacks, less to reason about.</>),
        P(<><strong>Encoding is fast.</strong> This is the practical difference from AVIF. WebP encodes in a fraction of the time, which matters if your images are generated on demand, transformed in a CDN worker, or if you are processing a large batch and care how long it takes.</>),
        P(<><strong>Support is effectively universal.</strong> Since roughly 2020 every current browser handles WebP, including older Safari versions that held out for years. That is why it remains the safe fallback beneath AVIF rather than being retired.</>),
      ]},
      { id: "lossy-vs-lossless", heading: "Lossy and lossless are different tools", body: [
        P(<>WebP has two distinct modes and they are not interchangeable. Choosing the wrong one is a common mistake.</>),
        P(<><strong>Lossy WebP</strong> replaces JPEG. Use it for photographs and anything with continuous tone. Quality 75–85 is the usable band, mirroring JPEG's.</>),
        P(<><strong>Lossless WebP</strong> replaces PNG. Use it for logos, icons, screenshots, UI graphics and anything with flat colour or text. It is frequently 20–30% smaller than an equivalent PNG.</>),
        P(<>Converting a screenshot or logo to <em>lossy</em> WebP is where WebP gets blamed unfairly — the artifacts around sharp edges and text are the result of choosing the wrong mode, not a flaw in the format.</>),
      ]},
    ],
    faqs: [
      { question: "What is WebP used for?", answer: "WebP is used for web images — photographs, graphics with transparency, and animations. It produces files 25–35% smaller than JPEG at equivalent quality, which reduces page weight and improves load times." },
      { question: "Does WebP support transparency?", answer: "Yes. WebP supports a full 8-bit alpha channel for transparency in both lossy and lossless modes." },
      { question: "Is WebP better than JPEG?", answer: "For web use, yes. WebP produces files 25–35% smaller than JPEG at matched visual quality and additionally supports transparency and lossless compression. JPEG remains useful only for maximum compatibility." },
      { question: "Should I use WebP or AVIF?", answer: "Serve AVIF first and WebP as the fallback. AVIF produces smaller files — roughly 20% smaller than WebP at matched quality — but WebP encodes far faster and has marginally broader support. In a <picture> element the browser picks the best format it understands, so offering both costs nothing." },
      { question: "Why does my image look worse after converting to WebP?", answer: "Almost always because a flat-colour graphic was saved in lossy mode. Screenshots, logos, icons and anything with text or sharp edges should use WebP lossless, which is still typically 20–30% smaller than PNG. Lossy WebP is for photographs." },
    ],
    related: [
      { path: "/formats/webp", label: "WebP compressor" },
      { path: "/learn/webp-vs-avif", label: "WebP vs AVIF" },
      { path: "/glossary/avif", label: "What is AVIF?" },
    ],
  },

  "/glossary/lossless-compression": {
    path: "/glossary/lossless-compression",
    h1: "Lossless compression",
    lede: "Compression that shrinks a file without discarding any data — the original can be reconstructed bit for bit.",
    keywords: ["lossless compression", "lossy vs lossless", "image compression", "png optimization"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Lossless compression reduces file size by encoding data more efficiently, while discarding nothing. The decompressed image is mathematically identical to the original — pixel for pixel. PNG and WebP's lossless mode are lossless formats; OxiPNG and zlib re-compression are lossless operations.</>)] },
      { id: "vs-lossy", heading: "Lossless vs lossy", body: [P(<>Lossy compression (JPEG, AVIF, WebP lossy) permanently discards data the eye is unlikely to notice — typically achieving far smaller files. Lossless compression never discards anything, so its savings are smaller but its fidelity is perfect. Use lossless for flat graphics, logos, screenshots and medical or technical imagery; lossy for photographs.</>)] },
      { id: "how-it-works", heading: "How it actually saves anything", body: [
        P(<>If nothing is discarded, where do the savings come from? Two places, and understanding them tells you how much a lossless tool can realistically achieve.</>),
        P(<><strong>Removing redundancy.</strong> Image data repeats itself — long runs of identical pixels, recurring colour values, predictable patterns. Lossless compression replaces those repetitions with shorter references. A screenshot of a UI is highly repetitive, which is why it compresses so well; a photograph of foliage is close to random, which is why it barely compresses at all.</>),
        P(<><strong>Choosing better filters before compressing.</strong> PNG applies a per-row filter to make the data more compressible — comparing each pixel to the one beside or above it often produces mostly zeros, which then deflate efficiently. Optimisers try several filter strategies per row and keep whichever compresses best. This is where OxiPNG and similar tools win their 5–20%, and it is genuinely lossless.</>),
      ]},
      { id: "how-much-to-expect", heading: "How much you can expect", body: [
        P(<>Setting realistic expectations matters, because lossless tools are often marketed as if they do more than they can.</>),
        P(<><strong>Flat graphics compress dramatically.</strong> Screenshots, logos, icons and charts commonly shrink by 20–40% or more, sometimes considerably more if the source PNG was saved carelessly. A PNG exported from an editor at default settings frequently contains a lot of recoverable slack.</>),
        P(<><strong>Photographs compress barely at all.</strong> A photograph saved as PNG is already near the entropy limit of the format. Expect single-digit percentages. If a tool claims to halve a photographic PNG losslessly, either the original was badly encoded or the tool is not actually lossless.</>),
        P(<><strong>Repeated optimisation does nothing.</strong> Once a file is optimised, running it through another lossless optimiser yields roughly nothing — there is no redundancy left to find. This is a useful test of an honest tool, and of an honest claim.</>),
      ]},
    ],
    faqs: [
      { question: "What is the difference between lossy and lossless compression?", answer: "Lossy compression permanently discards some data to achieve much smaller files (JPEG, AVIF, WebP lossy). Lossless compression discards nothing — the original is reconstructed exactly — so files are larger but perfect (PNG, WebP lossless, OxiPNG optimization)." },
      { question: "Is PNG lossless?", answer: "Yes, PNG is always lossless. Any tool that visibly degrades a PNG is converting it, not optimizing it. PNG optimization works by improving filters and DEFLATE compression, not by removing pixels." },
      { question: "Should I use lossless or lossy compression for web images?", answer: "Lossy for photographs (WebP or AVIF at quality 80 — visually identical, far smaller). Lossless for flat-color graphics, logos, screenshots and anything with text, where compression artifacts are obvious." },
      { question: "How much smaller can lossless compression make a file?", answer: "It depends entirely on the content. Flat graphics such as screenshots, logos and charts commonly shrink 20–40%, because they contain a lot of redundancy. Photographs compress by only a few percent, because a photographic PNG is already close to the format's entropy limit." },
      { question: "Why does optimising my PNG a second time do nothing?", answer: "Because there is no redundancy left to remove. Lossless optimisation finds repeated patterns and better filter choices; once those are already optimal, a second pass has nothing to work with. This is expected, and a tool that claims large further savings on an already-optimised file is worth scrutinising." },
    ],
    related: [
      { path: "/formats/png", label: "PNG compressor" },
      { path: "/learn/reduce-image-file-size", label: "9 ways to reduce image file size" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
    ],
  },

  "/glossary/core-web-vitals": {
    path: "/glossary/core-web-vitals",
    h1: "Core Web Vitals",
    lede: "Google's three metrics for real-world page experience: LCP (loading), INP (responsiveness) and CLS (visual stability).",
    keywords: ["core web vitals", "lcp", "inp", "cls", "page experience"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Core Web Vitals are Google's standardized metrics for page experience, measured from real Chrome users: <strong>LCP</strong> (Largest Contentful Paint), <strong>INP</strong> (Interaction to Next Paint) and <strong>CLS</strong> (Cumulative Layout Shift). Each has a target that must be met for at least 75% of page loads.</>)] },
      { id: "targets", heading: "The targets", body: [P(<><strong>LCP under 2.5 seconds</strong> — loading. <strong>INP under 200 milliseconds</strong> — responsiveness to taps and clicks. <strong>CLS under 0.1</strong> — visual stability. Images are the leading cause of failures in all three: the hero image usually is the LCP element, decoding blocks INP, and missing width/height attributes cause CLS.</>)] },
      { id: "why-field-data", heading: "Why Google measures real users, not lab tests", body: [
        P(<>A detail worth understanding, because it explains why your own speed test can pass while Google reports failure.</>),
        P(<>Core Web Vitals come from the <strong>Chrome UX Report</strong> — aggregated measurements from actual visitors on real devices and real connections. Not from a synthetic test on a fast server. So a page that scores 95 in Lighthouse can still fail Core Web Vitals if enough real users load it on an older phone over a poor mobile connection.</>),
        P(<>The <strong>75% threshold</strong> is the consequence: a metric passes when at least three-quarters of page loads meet the target. One slow segment of your audience — a particular country, a particular device — can fail a page that looks healthy in aggregate.</>),
        P(<>This is why a lab tool like Lighthouse is useful for diagnosing a problem but not authoritative for judging it. When the two disagree, the field data is what Google acts on.</>),
      ]},
      { id: "images-and-each-metric", heading: "How images affect each one", body: [
        P(<>The site is about image compression, so it is worth being specific about the relationship — it is not uniform across the three metrics.</>),
        P(<><strong>LCP — mostly images.</strong> The largest element in the initial viewport is usually a hero image or a heading, and images are the more common culprit. The fixes are concrete: serve a modern format, compress it, size it appropriately, mark it <code>fetchpriority="high"</code>, and preload it. Lazy-loading the hero is the classic own-goal.</>),
        P(<><strong>CLS — caused by images without dimensions.</strong> If an image has no <code>width</code> and <code>height</code>, the browser reserves no space and the layout jumps when it arrives. Setting both attributes — or an aspect-ratio box — lets the browser reserve the correct space before the image loads, which removes the shift entirely.</>),
        P(<><strong>INP — images matter less than scripts.</strong> INP measures how quickly the page responds to interaction. Large images contribute mainly through main-thread contention: decoding a very large image can occupy the thread and delay a response. Reducing image dimensions helps here more than reducing file size, because decode cost scales with pixel count rather than bytes.</>),
      ]},
    ],
    faqs: [
      { question: "What are the three Core Web Vitals?", answer: "LCP (Largest Contentful Paint) measures loading, INP (Interaction to Next Paint) measures responsiveness to user input, and CLS (Cumulative Layout Shift) measures visual stability. Each must meet its target for at least 75% of page loads." },
      { question: "What is a good LCP score?", answer: "Under 2.5 seconds for at least 75% of page loads. On most pages the LCP element is a hero image, so compressing it, converting it to AVIF or WebP, and adding fetchpriority=\"high\" plus a preload are the highest-impact fixes." },
      { question: "Do Core Web Vitals affect SEO?", answer: "Yes. Page speed is a confirmed Google ranking signal and Core Web Vitals are part of that signal. Google measures them from real users via the Chrome UX Report, and poor scores can also limit eligibility for certain rich results." },
      { question: "Why does Lighthouse say my page is fast but Google reports it as slow?", answer: "Because they measure different things. Lighthouse runs a synthetic test on a controlled connection; Core Web Vitals come from real visitors via the Chrome UX Report, on their actual devices and networks. When the two disagree, Google acts on the field data." },
      { question: "Do images affect CLS?", answer: "Yes, and they are one of the most common causes. An image without width and height attributes reserves no space, so the layout shifts when it loads. Setting both attributes, or using an aspect-ratio box, lets the browser reserve the correct space in advance and removes the shift." },
      { question: "Which is more important, LCP or INP?", answer: "Both are part of the same assessment — there is no ranking between them. LCP is more often the one failed by image-heavy sites, since the hero image is usually the largest element. INP is more often failed by script-heavy sites. Fix whichever your field data shows failing." },
    ],
    related: [
      { path: "/learn/core-web-vitals-images", label: "Images & Core Web Vitals" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
      { path: "/glossary/lazy-loading", label: "What is lazy loading?" },
    ],
  },

  "/glossary/mozjpeg": {
    path: "/glossary/mozjpeg",
    h1: "MozJPEG",
    lede: "Mozilla's improved JPEG encoder — same JPEG format, roughly 10–15% smaller files at equal quality.",
    keywords: ["mozjpeg", "jpeg encoder", "jpeg compression", "progressive jpeg"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>MozJPEG is a JPEG encoder maintained by Mozilla. It improves on the standard libjpeg encoder with <strong>trellis quantization</strong> (choosing coefficients that compress better at equal visual quality) and <strong>progressive encoding</strong>, producing JPEGs that are typically 10–15% smaller at the same visual quality while remaining 100% standard JPEG files.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>Because MozJPEG output is a standard JPEG, it works everywhere JPEG works — no browser or tool changes needed. The catch is that few online compressors actually use it. ImageAlchemy uses MozJPEG for its JPEG output path.</>)] },
      { id: "why-encoder-matters", heading: "Why the encoder matters more than the format", body: [
        P(<>People discuss image formats as though the format decides the file size. It does not. The <strong>encoder</strong> decides, and JPEG is the clearest example.</>),
        P(<>JPEG has been a fixed standard since 1992. Any compliant encoder produces files that every decoder reads. What the standard does not dictate is how hard the encoder works to choose good coefficients — and that is where the entire 10–15% lives. Two encoders can produce mathematically valid JPEGs from the same source, at the same quality setting, with visibly different file sizes.</>),
        P(<>MozJPEG is essentially libjpeg with a great deal more effort spent on those choices. To you this is pure gain: smaller files, identical compatibility, no quality trade-off. There is no downside beyond slightly slower encoding.</>),
      ]},
      { id: "progressive-vs-baseline", heading: "Progressive and baseline JPEG", body: [
        P(<>The other MozJPEG improvement is less obvious but affects perceived speed.</>),
        P(<><strong>Baseline</strong> JPEG stores the image top to bottom. A slow connection shows it filling in from the top, like a curtain being drawn down.</>),
        P(<><strong>Progressive</strong> JPEG stores several passes at increasing detail, so the whole image appears blurry almost immediately and then sharpens. Same final quality, same file size class, but the page feels faster because the visitor sees something meaningful sooner.</>),
        P(<>Progressive is the better default for web use, and MozJPEG enables it. Note that progressive JPEGs are slightly more expensive to decode, which matters only on very constrained devices and rarely outweighs the perceptual benefit.</>),
      ]},
    ],
    faqs: [
      { question: "What does MozJPEG do?", answer: "MozJPEG is an improved JPEG encoder. Using trellis quantization and progressive encoding, it produces standard JPEG files that are roughly 10–15% smaller than those from the default libjpeg encoder, at the same visual quality." },
      { question: "Are MozJPEG files different from normal JPEGs?", answer: "No. MozJPEG output is a 100% standard JPEG file — every browser, editor and device reads it. The improvement is purely in how the file is encoded, not in the format itself." },
      { question: "Is MozJPEG free?", answer: "Yes. MozJPEG is open source, maintained by Mozilla, and royalty-free to use. ImageAlchemy uses it as its JPEG encoder." },
      { question: "Why is my JPEG still large after compression?", answer: "Two likely reasons. The encoder may be a basic one — the same JPEG can differ 10–15% in size depending on how much effort the encoder spends, which is what MozJPEG improves. Or the image dimensions are simply too large; reducing pixel width usually saves far more than any encoder setting." },
      { question: "What is progressive JPEG?", answer: "A JPEG encoding that stores several passes of increasing detail, so the whole image appears blurred almost immediately and then sharpens. A baseline JPEG fills in from the top instead. Progressive files feel faster to load at the same final quality, and MozJPEG produces them." },
      { question: "Should I use MozJPEG or WebP for JPEG photos?", answer: "WebP if you can serve it, since it is smaller still and now universally supported. Keep MozJPEG-encoded JPEG as the fallback inside a <picture> element — it is the best version of the one format every browser on earth understands." },
    ],
    related: [
      { path: "/formats/jpeg", label: "JPEG compressor" },
      { path: "/learn/reduce-image-file-size", label: "9 ways to reduce image file size" },
      { path: "/glossary/chroma-subsampling", label: "What is chroma subsampling?" },
    ],
  },

  "/glossary/chroma-subsampling": {
    path: "/glossary/chroma-subsampling",
    h1: "Chroma subsampling",
    lede: "How JPEG and other formats shrink files by storing less color detail than brightness detail.",
    keywords: ["chroma subsampling", "4:4:4", "4:2:0", "jpeg color", "image compression"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Chroma subsampling reduces file size by storing <strong>color (chroma) information at lower resolution than brightness (luma) information</strong>. The human eye is more sensitive to brightness detail than color detail, so discarding color data is rarely noticed. Notation like 4:4:4, 4:2:2 and 4:2:0 describes how many chroma samples are kept per block of pixels.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<><strong>4:2:0</strong> is the default for most web JPEGs and halves the color data — usually invisible on photographs. <strong>4:4:4</strong> keeps full color resolution and matters for images with saturated hard edges: graphics, text, screenshots and product shots with strong color boundaries. If you see color bleeding on a compressed screenshot, that's chroma subsampling.</>)] },
      { id: "why-the-eye", heading: "Why the eye tolerates it", body: [
        P(<>The technique relies on a genuine property of human vision rather than a convenient approximation, which is why it has survived in every major format since the late 1980s.</>),
        P(<>Your retina contains far more rods, which detect brightness, than cones, which detect colour. Brightness detail is therefore resolved at much higher spatial resolution than colour detail. Present a fine alternating pattern of light and dark and you see it clearly; present the same pattern at full brightness but alternating red and green, and from a normal viewing distance it blurs into a single muddy tone.</>),
        P(<>Subsampling exploits exactly that limit. It throws away colour resolution you were never going to perceive, while keeping all the brightness resolution you would notice immediately.</>),
      ]},
      { id: "when-it-bites", heading: "When it becomes visible", body: [
        P(<>The failure mode is predictable, and you have almost certainly seen it without knowing the cause.</>),
        P(<><strong>Red text on a white background</strong> is the classic case. Text is fine, high-contrast detail; when colour resolution is halved, red glyph edges pick up grey and pink fringing. This is why screenshots of text should never be JPEG — use PNG or WebP lossless instead.</>),
        P(<><strong>Saturated graphics and flat colour blocks</strong> suffer because they have sharp colour boundaries with little brightness variation. A chart with a bright red bar beside a bright blue bar is asking for colour bleeding.</>),
        P(<><strong>Photographs are almost immune.</strong> Natural scenes have gradual colour transitions and rarely place two fully saturated complementary colours edge to edge, which is why 4:2:0 is a safe default at normal viewing sizes.</>),
        P(<>The practical rule: if an image contains text, UI, or hard-edged saturated colour, choose a format without chroma subsampling — or set 4:4:4 if your encoder offers it. If it is a photograph, leave the default alone. Note that AVIF and WebP handle colour differently again, so a screenshot that bleeds as JPEG may be perfectly clean as WebP lossless.</>),
      ]},
    ],
    faqs: [
      { question: "What does 4:2:0 mean?", answer: "It's a chroma subsampling mode: for every 4-pixel-by-2-pixel block, 2 chroma samples are kept in the horizontal direction and 0 additional vertical resolution — effectively halving color resolution in both directions. It's the default for most web JPEGs and is invisible on most photographs." },
      { question: "What is the difference between 4:4:4 and 4:2:0?", answer: "4:4:4 keeps full color resolution; 4:2:0 halves it horizontally and vertically. 4:2:0 produces smaller files and is fine for photographs. Use 4:4:4 for graphics, text and screenshots where color bleeding along hard edges would be visible." },
      { question: "Does chroma subsampling reduce quality?", answer: "It reduces color detail, which the human eye notices far less than brightness detail. On photographs at normal viewing size, 4:2:0 is effectively invisible. On saturated hard edges — text, screenshots, flat graphics — it can cause visible color bleeding, which is why those images are better served as PNG or WebP." },
      { question: "Why does red text look blurry in JPEG?", answer: "Red text on white is the worst case for chroma subsampling. Text is fine high-contrast detail, and 4:2:0 halves the color resolution, so red glyph edges pick up grey and pink fringing. Screenshots containing text should be saved as PNG or WebP lossless, not JPEG." },
      { question: "Is chroma subsampling used in WebP and AVIF?", answer: "Both handle color more flexibly than JPEG and generally preserve sharp color edges better at equivalent file sizes. AVIF in particular performs well on saturated graphics. If a screenshot bleeds as JPEG but you want a compressed format, try WebP lossless or AVIF before assuming the problem is unavoidable." },
    ],
    related: [
      { path: "/formats/jpeg", label: "JPEG compressor" },
      { path: "/glossary/mozjpeg", label: "What is MozJPEG?" },
      { path: "/learn/image-optimization-guide", label: "Image optimization guide" },
    ],
  },

  "/glossary/entropy-coding": {
    path: "/glossary/entropy-coding",
    h1: "Entropy coding",
    lede: "The final, lossless stage of image compression — squeezing out the last bits by representing common values more compactly.",
    keywords: ["entropy coding", "huffman coding", "deflate", "image compression"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Entropy coding is a lossless compression step that represents frequently occurring values with short codes and rare values with long ones. It's the last stage of most image codecs: PNG's DEFLATE, JPEG's Huffman tables, and the arithmetic/ANS coding in AV1 and WebP. Because it's lossless, re-encoding it more aggressively can only help.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>This is what a PNG optimizer like OxiPNG attacks: it re-runs entropy coding with stronger settings and better filters to produce a mathematically identical but smaller file. It's why \"lossless optimization\" is real and why two PNGs of the same pixels can have different file sizes.</>)] },
      { id: "the-idea", heading: "The idea, explained plainly", body: [
        P(<>Entropy coding is easier to grasp through a postal analogy than through information theory.</>),
        P(<>Suppose you must send thousands of letters and 90% of them go to one address. Writing the full address on every envelope wastes space. Instead, agree in advance that a short mark means that address, and reserve longer marks for the rare destinations. Total characters sent drops sharply, and nothing is lost — the recipient still knows exactly where each letter goes.</>),
        P(<>Entropy coding does this with numbers. It builds a table mapping each value to a code whose length depends on how often that value appears, then writes only the codes. Frequent values get short codes; rare ones get long codes. The decoder reads the same table and reconstructs the original exactly.</>),
      ]},
      { id: "why-it-matters", heading: "Why it matters to you", body: [
        P(<>This stage is why "lossless optimisation" is a real, honest claim rather than a contradiction — and why it has a hard ceiling.</>),
        P(<>Because entropy coding only changes representation, a tool can redo it more thoroughly than your original encoder did and produce a smaller file with pixel-identical output. Encoders are frequently conservative here: they pick a safe default table and move on, leaving measurable slack. A determined optimiser will search for a better table and find it.</>),
        P(<>The ceiling is set by the data itself. Entropy coding cannot invent compression where there is no statistical structure — random noise has none, and no amount of cleverness will shrink it. This is exactly why a photographic PNG barely improves while a screenshot improves a lot, and why running a second optimiser over an already-optimised file achieves nothing.</>),
      ]},
    ],
    faqs: [
      { question: "What is entropy coding in image compression?", answer: "It's the final lossless stage of most image codecs, where frequently occurring values are encoded with short codes and rare values with long ones. PNG uses DEFLATE, JPEG uses Huffman tables, and AV1/WebP use arithmetic or ANS coding." },
      { question: "Is entropy coding lossless?", answer: "Yes, always. Entropy coding only changes how data is represented, never the data itself. That's why PNG optimizers like OxiPNG can shrink files with zero quality loss — they only redo this stage more efficiently." },
      { question: "Why can the same image produce different file sizes?", answer: "Because the entropy-coding stage is not fully determined. Encoders choose how hard to search for optimal codes, so a conservative encoder leaves slack that a thorough optimiser can recover. Two PNGs with identical pixels can differ in size purely because they were encoded with different effort." },
      { question: "Can an image be compressed losslessly forever?", answer: "No. Entropy coding cannot create structure that is not there. Image data with genuine statistical redundancy shrinks well; random noise does not compress at all. Once a file has been optimised, further passes yield nothing because there is no remaining redundancy to encode away." },
    ],
    related: [
      { path: "/formats/png", label: "PNG compressor" },
      { path: "/glossary/lossless-compression", label: "What is lossless compression?" },
    ],
  },

  "/glossary/lazy-loading": {
    path: "/glossary/lazy-loading",
    h1: "Lazy loading",
    lede: "Deferring image downloads until they're actually needed, cutting initial page weight and improving load times.",
    keywords: ["lazy loading", "loading lazy", "image loading", "web performance"],
    sections: [
      { id: "definition", heading: "Definition", body: [P(<>Lazy loading means an image is only fetched when it approaches the viewport. In modern browsers it needs no JavaScript: add <code>loading="lazy"</code> to the <code>&lt;img&gt;</code> tag. The browser estimates each image's position and loads off-screen images just before they scroll into view.</>)] },
      { id: "in-practice", heading: "In practice", body: [P(<>Lazy-load everything <em>below</em> the fold — never the hero image, which is usually the LCP element and should load eagerly with <code>fetchpriority="high"</code>. Without lazy loading, a long page with 40 images downloads all of them immediately; with it, a visitor who reads two paragraphs never downloads most of them.</>)] },
      { id: "the-exception-that-hurts", heading: "The exception that hurts most sites", body: [
        P(<>The single most common performance mistake with lazy loading is applying it to the wrong image — and the mistake makes pages measurably slower, not faster.</>),
        P(<>Google's Largest Contentful Paint metric measures when the biggest element in the viewport finishes rendering. On most pages that element is the hero image. If you lazy-load it, you have told the browser to delay the one image the metric depends on: it must first compute layout, decide the image is near the viewport, then start the download. That delay lands directly on your LCP score.</>),
        P(<>The correct treatment for a hero image is the opposite of lazy: <code>fetchpriority="high"</code> so the browser prioritises it, plus a <code>preload</code> hint in the document head so the download begins before the parser reaches the tag. Lazy loading belongs on everything below the fold, which is where it does its real work.</>),
      ]},
      { id: "what-it-does-not-fix", heading: "What lazy loading does not fix", body: [
        P(<>Lazy loading is often presented as a general performance cure. It is not, and treating it as one leads to disappointment.</>),
        P(<><strong>It does not reduce page weight for a short page.</strong> If all your images are visible on load, lazy loading changes nothing at all — there is nothing off-screen to defer.</>),
        P(<><strong>It does not compress anything.</strong> A 4 MB hero image is still 4 MB. Lazy loading might stop it loading immediately, but on the pages that matter it is usually the image that must load first. Compression and correct sizing are what reduce weight; lazy loading only changes when things arrive.</>),
        P(<><strong>It does not reliably stop the layout shifting.</strong> If an image has no width and height, the browser reserves zero space for it and the page reflows when it finally loads. That is a Cumulative Layout Shift problem, and lazy loading makes it more likely, not less. Always set explicit dimensions or an aspect-ratio box.</>),
      ]},
      { id: "how-to-check", heading: "How to tell whether it is working", body: [
        P(<>This is one of the easier claims to verify, and worth checking rather than trusting.</>),
        P(<>Open your browser's network panel, load the page, and filter to images. On a lazy-loaded page you should see only the images in and near the viewport requested on initial load. Scroll down and further requests appear as you go.</>),
        P(<>If every image is requested at once, lazy loading is not taking effect — usually because the attribute is missing, or because a JavaScript carousel is setting image sources before the browser can defer them. If the hero image request appears late, after stylesheets and scripts, that is the LCP problem described above and it is worth fixing first.</>),
      ]},
    ],
    faqs: [
      { question: "What is lazy loading of images?", answer: "It's deferring an image's download until it's about to enter the viewport. In modern browsers it's built in: add loading=\"lazy\" to an <img> tag and the browser handles the rest, no JavaScript required." },
      { question: "Should I lazy-load the hero image?", answer: "No. The hero image is usually the Largest Contentful Paint element, and lazy loading it delays the single most important render on the page. Load it eagerly with fetchpriority=\"high\" and a preload hint. Lazy-load only below-the-fold images." },
      { question: "Does lazy loading improve Core Web Vitals?", answer: "It can improve LCP on long pages by stopping off-screen images from competing for bandwidth with the hero image. It does not help CLS — and can worsen it if images lack width and height attributes, because the browser reserves no space for them before they load." },
      { question: "Does lazy loading reduce image file size?", answer: "No. It changes when an image is downloaded, not how large it is. The only way to reduce page weight is to compress images and serve them at appropriate dimensions. Lazy loading is a scheduling improvement, not a size reduction." },
      { question: "How do I test whether lazy loading is working?", answer: "Open the browser network panel and load the page. Only images in or near the viewport should be requested initially; more should appear as you scroll. If every image loads immediately, the attribute is missing or a script is overriding it." },
    ],
    related: [
      { path: "/learn/core-web-vitals-images", label: "Images & Core Web Vitals" },
      { path: "/glossary/core-web-vitals", label: "What are Core Web Vitals?" },
    ],
  },
};
