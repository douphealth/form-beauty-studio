import { HOME_FAQS } from "@/content/studio-faq";
import { lazy, Suspense, useState } from "react";
import { Link } from "react-router-dom";
import {
  Aperture,
  ScanLine,
  Image as ImageIcon,
  Layers,
  FileImage,
  BookOpen,
  ChevronDown,
} from "lucide-react";
import type { OutputFormat } from "@/lib/image-utils";

const Lab = lazy(() => import("./HeroFeatures"));
const formats = [
  {
    format: "webp",
    title: "WebP",
    icon: Aperture,
    intent: "Web photography",
    text: "A compact starting point for photos and transparent product images.",
  },
  {
    format: "avif",
    title: "AVIF",
    icon: Layers,
    intent: "Small web exports",
    text: "Compare fine detail against WebP when the download size matters most.",
  },
  {
    format: "jpeg",
    title: "JPEG",
    icon: ImageIcon,
    intent: "Sharing & email",
    text: "A familiar choice for opaque photos that need to open in many apps.",
  },
  {
    format: "png",
    title: "PNG",
    icon: FileImage,
    intent: "Pixel-perfect graphics",
    text: "Preserve sharp text, flat color and transparency with lossless encoding.",
  },
] as const;
const guides = [
  [
    "/learn/image-optimization-guide",
    "Image optimization from source to delivery",
  ],
  ["/learn/compress-images-for-web", "How to compress images for the web"],
  ["/learn/webp-vs-avif", "WebP or AVIF for your next export?"],
  ["/learn/jpeg-quality-guide", "Choosing a JPEG quality setting"],
  ["/learn/reduce-image-file-size", "Nine ways to reduce image file size"],
  ["/learn/responsive-images", "Serve the right size with srcset"],
  [
    "/learn/compress-images-without-uploading",
    "How local image processing works",
  ],
  ["/learn/core-web-vitals-images", "Images and Core Web Vitals"],
];
type Props = {
  onFormat?: (format: OutputFormat) => void;
  onQuality?: (q: number) => void;
};
export default function StudioResources({ onFormat, onQuality }: Props) {
  const [labOpen, setLabOpen] = useState(false);
  return (
    <div className="studio-resources">
      <section className="format-section" aria-labelledby="format-heading">
        <div className="section-title">
          <h2 id="format-heading">
            Choose your <em>format.</em>
          </h2>
          <Link to="/tools/image-converter">Conversion guide</Link>
        </div>
        <div className="format-grid">
          {formats.map(({ format, title, icon: Icon, intent, text }) => (
            <div className={"format-sheet " + format} key={format}>
              <div className="format-mark">
                <Icon size={21} />
                <span>{intent}</span>
              </div>
              <h3>
                <Link to={"/formats/" + format}>{title}</Link>
              </h3>
              <p>{text}</p>
              <a
                href={"/?preset=" + format + "#tool"}
                onClick={(e) => {
                  if (
                    !onFormat ||
                    e.ctrlKey ||
                    e.metaKey ||
                    e.shiftKey ||
                    e.altKey
                  )
                    return;
                  e.preventDefault();
                  onFormat(format);
                }}
              >
                Use {title}
              </a>
            </div>
          ))}
        </div>
      </section>
      <details
        className="lab-disclosure"
        onToggle={(e) => setLabOpen(e.currentTarget.open)}
      >
        <summary>
          <span>
            <Aperture size={20} /> Explore quality and file size
          </span>
          <ChevronDown size={18} />
        </summary>
        {labOpen && (
          <Suspense fallback={<p>Loading comparison tools…</p>}>
            <Lab onQuality={onQuality} />
          </Suspense>
        )}
      </details>
      <div className="reading-grid">
        <section>
          <div className="section-title">
            <h2>
              Field <em>guides.</em>
            </h2>
            <Link to="/learn">All guides</Link>
          </div>
          <ul className="guide-index">
            {guides.map(([path, label]) => (
              <li key={path}>
                <Link to={path}>
                  <BookOpen size={16} />
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="resource-links">
            <Link to="/tools/image-resizer">Image resizer</Link> ·{" "}
            <Link to="/glossary">Compression glossary</Link>
          </p>
        </section>
        <section className="studio-faq">
          <h2>
            Studio <em>questions.</em>
          </h2>
          {HOME_FAQS.map((f) => (
            <details key={f.question}>
              <summary>
                {f.question}
                <ChevronDown size={16} />
              </summary>
              <p>{f.answer}</p>
            </details>
          ))}
        </section>
      </div>
      <div className="audit-panel">
        <ScanLine size={30} />
        <div>
          <h2>Which images slow your page down?</h2>
          <p>
            Inspect page image weight, formats and delivery with the website
            image audit.
          </p>
        </div>
        <Link to="/pro">Explore the audit</Link>
      </div>
      <p className="studio-credit">
        Denali photograph by the{" "}
        <a href="https://npgallery.nps.gov/AssetDetail/6d3cdb48-e87f-4d6a-9206-ad22a53500b0">
          National Park Service
        </a>
        . <a href="#root">Back to the studio</a>.
      </p>
    </div>
  );
}
