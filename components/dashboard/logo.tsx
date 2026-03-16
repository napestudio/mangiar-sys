import Image from "next/image";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <Image
      src="https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg"
      alt="Mangi.ar"
      width={120}
      height={40}
      className={className}
      priority
    />
  );
}
