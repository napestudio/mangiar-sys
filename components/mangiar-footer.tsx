import Link from "next/link";
import Logo from "./dashboard/logo";

export default function MangiarFooter() {
  return (
    <footer className="fixed bottom-0 w-full bg-white border-t">
      <Link href={"/"}>
        <div className="flex items-center justify-center px-8 md:px-0 py-3 text-center text-sm text-gray-500">
          Desarrollado por <Logo className="mx-1 h-4 w-auto" /> &copy;
          {new Date().getFullYear()}
        </div>
      </Link>
    </footer>
  );
}
