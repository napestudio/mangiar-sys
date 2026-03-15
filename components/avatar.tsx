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
    <div className="h-28">
      <Image
        src={
          src ||
          "https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg"
        }
        alt={alt}
        width={256}
        height={256}
        priority
        className="h-24 w-auto"
      />
    </div>
  );
}
