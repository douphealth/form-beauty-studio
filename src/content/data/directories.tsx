import type { ContentEntry } from "../types";

export const DIRECTORIES: Record<string, ContentEntry> = {
  "/formats": {
    path: "/formats",
    h1: "Choose an image format",
    lede: "Choose the output that fits the image and its destination. Compare two exports at the same dimensions to see what each format keeps.",
    keywords: [],
    faqs: [],
    sections: [
      {
        id: "photos",
        heading: "Website photos",
        body: [
          <p>
            Start with <a href="/formats/webp">WebP</a> and compare an{" "}
            <a href="/formats/avif">AVIF</a> export at the same dimensions. Look
            at edges, skin tones and fine texture before choosing the smaller
            file.
          </p>,
        ],
      },
      {
        id: "graphics",
        heading: "Screenshots, logos and diagrams",
        body: [
          <p>
            Choose <a href="/formats/png">PNG</a> when text and flat colors need
            to remain exact. Keep the original dimensions for a pixel-for-pixel
            comparison.
          </p>,
        ],
      },
      {
        id: "sharing",
        heading: "Attachments and shared photos",
        body: [
          <p>
            Use <a href="/formats/jpeg">JPEG</a> for a broadly compatible photo
            attachment. Resize to the dimensions the recipient needs before
            reducing quality. See{" "}
            <a href="/learn/reduce-image-file-size">
              other ways to reduce file size
            </a>{" "}
            and <a href="/learn/responsive-images">responsive image delivery</a>
            .
          </p>,
        ],
      },
    ],
    related: [
      { path: "/learn/webp-vs-avif", label: "Compare WebP and AVIF" },
      { path: "/tools/image-converter", label: "Image conversion guide" },
    ],
  },
  "/tools": {
    path: "/tools",
    h1: "Image tools and workflows",
    lede: "Start with the task you need to complete. File compression, format conversion and proportional resizing run in the browser.",
    keywords: [],
    faqs: [],
    sections: [
      {
        id: "resize",
        heading: "Reduce image dimensions",
        body: [
          <p>
            Use the <a href="/tools/image-resizer">image resizer guide</a> to
            choose a maximum dimension. The studio scales width and height
            together so the image keeps its proportions.
          </p>,
        ],
      },
      {
        id: "convert",
        heading: "Convert individual images or a batch",
        body: [
          <p>
            Read the <a href="/tools/image-converter">image converter guide</a>{" "}
            to choose an output format, then <a href="/">open the studio</a>,
            add your files and download the results.
          </p>,
        ],
      },
      {
        id: "audit",
        heading: "Check a published page",
        body: [
          <p>
            The separate <a href="/pro">website image audit</a> investigates the
            images on a page. For a single file on your device, use the free
            studio. See{" "}
            <a href="/learn/reduce-image-file-size">ways to reduce file size</a>{" "}
            before exporting.
          </p>,
        ],
      },
    ],
    related: [
      { path: "/formats", label: "Image format guide" },
      { path: "/learn/responsive-images", label: "Serving responsive images" },
    ],
  },
};
