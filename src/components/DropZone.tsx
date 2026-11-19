import { useRef, useState } from "react";
import { Images, Upload } from "lucide-react";

import {
  createImageFile,
  validateFile,
  MAX_FILE_COUNT,
  type ImageFile,
} from "@/lib/image-utils";

function report(kind: "warning" | "error", message: string) {
  void import("sonner").then(({ toast }) => toast[kind](message));
}

interface Props {
  onFilesAdded: (files: ImageFile[]) => void;
  hasFiles: boolean;
  currentCount?: number;
  disabled?: boolean;
}

export default function DropZone({
  onFilesAdded,
  hasFiles,
  currentCount = 0,
  disabled = false,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [loadingSample, setLoadingSample] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const add = (files: File[]) => {
    if (disabled) return;
    const valid: ImageFile[] = [];
    for (const file of files) {
      if (currentCount + valid.length >= MAX_FILE_COUNT) {
        report("warning", "A batch holds up to 200 images.");
        break;
      }
      const error = validateFile(file);
      if (error) report("error", file.name + ": " + error);
      else valid.push(createImageFile(file));
    }
    if (valid.length) onFilesAdded(valid);
  };
  async function sample() {
    setLoadingSample(true);
    try {
      const response = await fetch("/studio-demo/alaska-range.jpg");
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      if (blob.type !== "image/jpeg") throw new Error();
      add([new File([blob], "alaska-range.jpg", { type: blob.type })]);
    } catch {
      report(
        "error",
        "The sample could not load. Try again or choose an image.",
      );
    } finally {
      setLoadingSample(false);
    }
  }

  return (
    <div
      id="tool"
      className={"studio-drop" + (dragging ? " dragging" : "")}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node))
          setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        add(Array.from(e.dataTransfer.files));
      }}
    >
      <input
        id="studio-files"
        type="file"
        multiple
        accept="image/*"
        ref={input}
        hidden
        onChange={(e) => {
          add(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
      <div className="drop-actions">
        <button
          className="primary-action"
          type="button"
          onClick={() => input.current?.click()}
          disabled={disabled}
        >
          <Upload size={19} />
          {hasFiles ? "Add more images" : "Choose images"}
        </button>
        {!hasFiles && (
          <button
            type="button"
            className="sample-button"
            onClick={sample}
            disabled={loadingSample || disabled}
          >
            <Images size={17} />
            {loadingSample ? "Loading…" : "Try a sample"}
          </button>
        )}
      </div>
      <p>
        {dragging
          ? "Drop files to add them to your batch."
          : "Or drop files here · Up to 200 images · 50 MB each"}
      </p>
      <noscript>
        Enable JavaScript to process images locally. The guides below are
        available to read.
      </noscript>
    </div>
  );
}
