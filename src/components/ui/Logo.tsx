import Image from "next/image";
import { LOGO_ASSET_PATH, LOGO_INTRINSIC } from "@/lib/ui/landing";

/**
 * The canonical Emtithal logo — the exact product-owner-supplied asset in
 * `/public`. Never redrawn, recreated with text, recolored, distorted, or
 * cropped. Aspect ratio is locked to the asset's intrinsic size; only the
 * rendered height varies.
 */
export function Logo({
  height = 36,
  className = "",
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  const width = Math.round((height * LOGO_INTRINSIC.width) / LOGO_INTRINSIC.height);
  return (
    <Image
      src={LOGO_ASSET_PATH}
      alt="امتثال Emtithal"
      width={width}
      height={height}
      priority={priority}
      className={className}
      style={{ height, width: "auto" }}
    />
  );
}
