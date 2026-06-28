import { useRef, useState } from "react";
import { toast } from "sonner";
import { adminApi, API } from "../lib/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Upload, Link as LinkIcon, X } from "lucide-react";

/**
 * Reusable image picker for admin CMS.
 *   value     — current image URL ("/api/files/..." or external https://...)
 *   onChange  — called with the new URL string (or "" when cleared)
 *   height    — preview height class (default h-40)
 *   testId    — base data-testid for upload + url controls
 */
export default function ImageUploader({ value, onChange, height = "h-40", testId = "img" }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const absoluteSrc = (v) => {
    if (!v) return "";
    if (/^https?:\/\//i.test(v)) return v;
    // Strip leading /api because the API constant already includes it
    const path = v.startsWith("/api/") ? v.slice(4) : v;
    return `${API}${path.startsWith("/") ? path : `/${path}`}`;
  };

  const pickFile = () => fileRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image too large (max 8 MB)");
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await adminApi.post("/admin/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(r.data.url);
      toast.success("Uploaded");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          size="sm"
          onClick={pickFile}
          disabled={uploading}
          className="bg-[#10B981] hover:bg-[#059669] text-white"
          data-testid={`${testId}-upload-btn`}
        >
          <Upload className="w-3.5 h-3.5 mr-1.5" />
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setShowUrl((s) => !s)}
          data-testid={`${testId}-url-toggle`}
        >
          <LinkIcon className="w-3.5 h-3.5 mr-1.5" />
          {showUrl ? "Hide URL field" : "Or paste URL"}
        </Button>
        {value && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => onChange("")}
            data-testid={`${testId}-clear-btn`}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Remove
          </Button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        onChange={handleFile}
        className="hidden"
        data-testid={`${testId}-file-input`}
      />

      {showUrl && (
        <Input
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://..."
          className="font-mono text-xs"
          data-testid={`${testId}-url-input`}
        />
      )}

      {value && (
        <img
          src={absoluteSrc(value)}
          alt=""
          className={`w-full ${height} object-cover rounded-lg border border-[#E5EFE8]`}
        />
      )}
    </div>
  );
}
