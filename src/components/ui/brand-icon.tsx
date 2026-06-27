import { siX, siInstagram, siFacebook, siYoutube } from "simple-icons";

// Resmi marka glyph path'leri (24x24 viewBox). LinkedIn simple-icons'tan kaldırıldı →
// resmi LinkedIn logo path'i doğrudan. Footer sosyal linkleri için (nominative use).
const LINKEDIN_PATH =
  "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z";

const MAP = {
  x: siX.path,
  instagram: siInstagram.path,
  facebook: siFacebook.path,
  youtube: siYoutube.path,
  linkedin: LINKEDIN_PATH,
} as const;

/** Gerçek marka logoları (resmi SVG path'leri), hepsi tutarlı 24x24. */
export function BrandIcon({
  name,
  size = 18,
  className,
}: {
  name: keyof typeof MAP;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      aria-label={name}
    >
      <path d={MAP[name]} />
    </svg>
  );
}
