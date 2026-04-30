"use client";

import Logo from "@/components/dashboard/logo";
import { navItems } from "@/components/website/nav-items";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useEffect, useState } from "react";
import ChefHatIcon from "../ui/icons/ChefHat";

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 250);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={cn(
        "bg-transparent border-0 fixed inset-x-0 z-50 font-sans transition-colors duration-300",
        scrolled && "bg-white shadow-md",
      )}
    >
      <div className="flex items-center justify-between gap-8 py-4 px-6 lg:px-32">
        <Link href="/" className="text-2xl font-bold text-black shrink-0">
          <Logo />
        </Link>

        {/* <div className="hidden md:flex items-center gap-8 uppercase font-medium text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-black hover:text-red transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </div> */}

        <div className="flex items-center gap-3">
          <Link
            href="/ingresar"
            className="cursor-pointer hidden sm:flex items-center rounded-full bg-white text-red border-2 border-red transition-transform hover:scale-105 px-6 py-2 font-medium"
          >
            <span className="w-5 h-5 inline-flex mr-2">
              <ChefHatIcon />
            </span>
            Ingresar
          </Link>

          {/* <button
            className="md:hidden p-2 rounded-full bg-white shadow-md text-black"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menú"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button> */}
        </div>
      </div>

      {open && (
        <div className="md:hidden mx-4 mt-1 rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden">
          <div className="flex flex-col p-4 gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-black hover:bg-gray-50 hover:text-red transition-colors uppercase"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t border-gray-100 mt-2 pt-3">
              <Link
                href="/ingresar"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-2 rounded-full bg-white text-red border-2 border-red px-6 py-2.5 font-medium text-sm"
              >
                <span className="w-4 h-4 inline-flex">
                  <ChefHatIcon />
                </span>
                Ingresar
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
