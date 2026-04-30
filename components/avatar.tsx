"use client";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt?: string;
}

export default function Avatar({
  src = "https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg",
  alt = "Logo",
}: AvatarProps) {
  return (
    <div className="relative w-full max-w-[80svw] md:max-w-sm h-64">
      <Image
        src={
          src ||
          "https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg"
        }
        alt={alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  );
}
