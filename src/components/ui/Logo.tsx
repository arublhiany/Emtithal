import { BRAND_NAME_AR, BRAND_NAME_EN } from "@/lib/ui/brand";

/** Text wordmark uses the application's Arabic font and current product name. */
export function Logo({
  height = 36,
  className = "",
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <span
      role="img"
      aria-label={`${BRAND_NAME_AR} ${BRAND_NAME_EN}`}
      className={`inline-flex shrink-0 flex-col items-center justify-center text-[var(--color-primary)] ${className}`}
      style={{ height, lineHeight: 1 }}
    >
      <span aria-hidden="true" className="font-extrabold" style={{ fontSize: height * 0.82 }}>
        {BRAND_NAME_AR}
      </span>
      <span aria-hidden="true" className="font-medium tracking-wide" style={{ fontSize: height * 0.23 }}>
        {BRAND_NAME_EN}
      </span>
    </span>
  );
}
