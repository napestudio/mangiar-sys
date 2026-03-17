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
    <div className="relative w-full h-64">
      <Image
        src={
          src ||
          "https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg"
        }
        alt={alt}
        fill
        style={{ objectFit: "contain" }}
        priority
      />
    </div>
  );
}
