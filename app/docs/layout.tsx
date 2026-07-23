import Logo from "@/components/dashboard/logo";
import Link from "next/link";
import { DocsSidebar } from "./components/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-gray-200 fixed inset-y-0 left-0 overflow-y-auto flex flex-col">
        {/* Logo area */}
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-gray-200 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-7 w-auto" />
          </Link>
          <span className="text-xs font-semibold text-gray-400 tracking-wide uppercase">
            Guía
          </span>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-4">
          <DocsSidebar />
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-100">
          <Link
            href="/dashboard"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            ← Volver al dashboard
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 min-w-0">{children}</main>
    </div>
  );
}
