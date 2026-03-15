import Image from "next/image";

export default function Logo() {
  return (
    <Image
      src="https://res.cloudinary.com/dztzomvin/image/upload/v1773611104/logo_repmwv.svg"
      alt="Mangi.ar"
      width={120}
      height={40}
      priority
    />
  );
}
