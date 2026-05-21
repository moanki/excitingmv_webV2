type ImageTransformOptions = {
  width?: number;
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
};

const SUPABASE_PUBLIC_OBJECT_MARKER = "/storage/v1/object/public/";
const SUPABASE_RENDER_IMAGE_MARKER = "/storage/v1/render/image/public/";

export function optimizedImageUrl(url: string | null | undefined, options: ImageTransformOptions = {}) {
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    const isSupabaseObject = parsed.pathname.includes(SUPABASE_PUBLIC_OBJECT_MARKER);
    const isSupabaseRendered = parsed.pathname.includes(SUPABASE_RENDER_IMAGE_MARKER);

    if (!isSupabaseObject && !isSupabaseRendered) {
      return url;
    }

    if (/\.(svg|gif|mp4|webm|mov|pdf|docx?|xlsx?|pptx?|csv|txt)$/i.test(parsed.pathname)) {
      return url;
    }

    parsed.pathname = parsed.pathname.replace(SUPABASE_PUBLIC_OBJECT_MARKER, SUPABASE_RENDER_IMAGE_MARKER);

    if (options.width) {
      parsed.searchParams.set("width", String(options.width));
    }

    if (options.height) {
      parsed.searchParams.set("height", String(options.height));
    }

    const requestedQuality = options.quality ?? 90;
    const minimumQuality = options.resize === "contain" ? 92 : 88;
    parsed.searchParams.set("resize", options.resize ?? "cover");
    parsed.searchParams.set("quality", String(Math.max(requestedQuality, minimumQuality)));

    return parsed.toString();
  } catch {
    return url;
  }
}

export function imageSrcSet(url: string | null | undefined, widths: number[], options: Omit<ImageTransformOptions, "width"> = {}) {
  return widths
    .map((width) => `${optimizedImageUrl(url, { ...options, width })} ${width}w`)
    .join(", ");
}
