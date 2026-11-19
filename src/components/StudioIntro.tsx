import { useState, type CSSProperties, type ComponentProps } from "react";
import {
  ChevronsLeftRight,
  LockKeyhole,
  SlidersHorizontal, ZoomIn,
} from "lucide-react";
import DropZone from "./DropZone";

const encodes = [
  { q: 30, label: "Compact", bytes: 47558 },
  { q: 65, label: "Balanced", bytes: 83314 },
  { q: 85, label: "Fine", bytes: 133656 },
];
const original = 215293;
const kib = (size: number) => (size / 1024).toFixed(1) + " KiB";

type ApplyQuality = { onApplyQuality?: (q: number) => void };
function SampleProof({ onApplyQuality }: ApplyQuality) {
  const [detail, setDetail] = useState(false);
  const [encode, setEncode] = useState(encodes[1]);
  const [split, setSplit] = useState(48);
  return (
    <figure className="sample-proof">
      <div
        className={"proof-frame" + (detail ? " detail-view" : "")}
        style={{ "--split": split + "%" } as CSSProperties}
      >
        <img
          className="comparison-photo"
          src={"/studio-demo/alaska-range-q" + encode.q + ".webp"}
          alt="Evening light on a copper-colored ridge above the blue Alaska Range in Denali."
          width="1080"
          height="675"
          {...{ fetchpriority: "high" }}
        />
        <div className="original-window"><img
          className="comparison-photo"
          src="/studio-demo/alaska-range.jpg"
          alt=""
          width="1080"
          height="675"
          decoding="async"
        /></div>
        <button className="proof-zoom" type="button" aria-pressed={detail} aria-label="Magnify photograph detail" onClick={() => setDetail(!detail)}>
          <ZoomIn size={16} />{detail ? "2× detail" : "1× view"}
        </button>
        <span className="photo-tag original-tag">Original</span>
        <span className="photo-tag output-tag">WebP · Q{encode.q}</span>
        <div className="proof-divider">
          <span>
            <ChevronsLeftRight size={18} />
          </span>
        </div>
        <input
          className="proof-slider"
          type="range"
          min="0"
          max="100"
          value={split}
          onChange={(e) => setSplit(+e.target.value)}
          aria-label="Reveal original photograph"
          aria-valuetext={split + "% original visible"}
        />
      </div>
      <figcaption className="proof-caption">
        <div className="proof-head">
          <span>
            <SlidersHorizontal size={14} /> Compare quality
          </span>
          <span className="proof-saving">
            {Math.round((1 - encode.bytes / original) * 100)}% smaller
          </span>
        </div>
        <div className="proof-controls">
          <div className="quality-switch" aria-label="Sample encoding quality">
            {encodes.map((item) => (
              <button
                key={item.q}
                type="button"
                aria-pressed={item.q === encode.q}
                onClick={() => setEncode(item)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <span className="proof-size" aria-live="polite">
            <s>{kib(original)}</s> <strong>{kib(encode.bytes)}</strong>
          </span>
        </div>
        <div className="proof-meter" aria-hidden="true"><i style={{width: (100 * encode.bytes / original) + "%"}} /></div>
        <div className="proof-export"><span>Measured sample sizes</span>
          <a href={"/?preset=webp&quality=" + encode.q + "#tool"} onClick={e => {
            if (!onApplyQuality || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault(); onApplyQuality(encode.q);
          }}>Use WebP Q{encode.q}</a>
        </div>
      </figcaption>
    </figure>
  );
}

export default function StudioIntro({ onApplyQuality, ...props }: ComponentProps<typeof DropZone> & ApplyQuality) {
  return (
    <section
      className={props.hasFiles ? "studio-intro queue-intro" : "studio-intro"}
    >
      <div className="intro-copy">
        <div className="local-note">
          <LockKeyhole size={14} /> On-device processing
        </div>
        <h1>
          {props.hasFiles ? (
            <>
              Your image <em>batch.</em>
            </>
          ) : (
            <>
              Image compression <em>studio.</em>
            </>
          )}
        </h1>
        {!props.hasFiles && (
          <p className="intro-description">
            Compress, convert and resize images in your browser. Choose a
            format, inspect the detail and download your files.
          </p>
        )}
        <DropZone {...props} />
      </div>
      {!props.hasFiles && <SampleProof onApplyQuality={onApplyQuality} />}
    </section>
  );
}
