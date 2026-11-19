import { useEffect, useRef, useState } from "react";
import { ChevronsLeftRight, Download, X } from "lucide-react";
import { downloadBlob, formatBytes, type ImageFile } from "@/lib/image-utils";

export default function ImagePreviewModal({ image, onClose }: { image: ImageFile; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mode, setMode] = useState<"Original" | "Export" | "Compare">(
    image.compressedUrl ? "Compare" : "Original"
  );
  const [split, setSplit] = useState(50);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const element = dialog.current;
    const trigger = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus();
    };
  }, []);

  return <dialog ref={dialog} className="image-inspector" aria-labelledby="inspector-name"
    onCancel={e => { e.preventDefault(); onClose(); }}
    onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="inspector-inner">
      <header><div><h2 id="inspector-name">{image.file.name}</h2>
        <p>Original {formatBytes(image.originalSize)}{image.compressedBlob && " · " + image.chosenFormat?.toUpperCase() + " " + formatBytes(image.compressedBlob.size)}</p>
      </div><button className="inspector-close" type="button" aria-label="Close preview" onClick={onClose}><X size={19}/></button></header>
      <div className="inspector-toolbar">
        {image.compressedUrl && <div className="inspector-tabs" role="group" aria-label="Preview mode">
          {(["Original", "Export", "Compare"] as const).map(view => <button type="button" key={view} aria-pressed={mode === view} onClick={() => setMode(view)}>{view}</button>)}
        </div>}
        <label>Zoom <select value={zoom} onChange={e => setZoom(Number(e.target.value))}>
          <option value={1}>Fit</option><option value={1.5}>1.5×</option><option value={2}>2×</option><option value={3}>3×</option>
        </select></label>
      </div>
      <div className="inspector-viewport">
        <div className="inspector-image" style={{width: zoom * 100 + "%"}}>
          <img src={mode === "Export" && image.compressedUrl ? image.compressedUrl : image.previewUrl} alt={(mode === "Export" ? "Export of " : "Original of ") + image.file.name}/>
          {mode === "Compare" && image.compressedUrl && <>
            <img className="inspector-overlay" style={{clipPath: "inset(0 " + (100 - split) + "% 0 0)"}} src={image.compressedUrl} alt="Compressed layer"/>
            <div className="inspection-line" style={{left:split+"%"}}><ChevronsLeftRight size={24}/></div>
            <input className="inspection-range" type="range" min="0" max="100" value={split} onChange={e=>setSplit(Number(e.target.value))} aria-label="Reveal compressed preview" aria-valuetext={split+"% compressed visible"}/>
          </>}
        </div>
      </div>
      <footer><span>{mode === "Compare" ? "Drag to compare · export on left" : mode + " preview"}</span>
        {image.compressedBlob && <button className="primary-action" type="button" onClick={() => downloadBlob(image.compressedBlob!, image.outputFilename)}><Download size={16}/>Download</button>}
      </footer>
    </div>
  </dialog>;
}
