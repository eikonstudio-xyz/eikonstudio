"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Menu, X, Sun, Bell } from "lucide-react";

const navLinks = [
  { label: "Products", href: "#packages" },
  { label: "About", href: "#about" },
  { label: "Open Source", href: "https://github.com/eikonstudio-xyz/eikonstudio" },
  { label: "Docs", href: "#packages" },
];

export function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "border-b border-white/[0.06]" : ""}`}
      >
        <div
          className={`backdrop-blur-xl transition-colors duration-300 ${scrolled ? "bg-neutral-950/80" : "bg-transparent"}`}
        >
          <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2.5 group">
                <Image
                  src="/logo.png"
                  alt="Eikon Studio"
                  width={28}
                  height={28}
                  className="transition-transform duration-200 group-hover:scale-105"
                />
                <span className="text-[15px] font-semibold tracking-tight text-white">Eikon</span>
              </Link>
              <div className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="px-3 py-1.5 text-sm text-neutral-400 hover:text-white transition-colors rounded-md hover:bg-white/[0.04]"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="hidden sm:flex p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors"
                aria-label="Toggle theme"
              >
                <Sun className="w-[18px] h-[18px]" />
              </button>
              <button
                className="hidden sm:flex p-2 rounded-lg text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.04] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
              </button>
              <Link
                href="#"
                className="hidden sm:inline-flex bg-emerald-500 hover:bg-emerald-400 text-black text-[13px] font-semibold px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                Open Studio
              </Link>
              <button
                className="md:hidden p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-white/[0.04] transition-colors"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Menu"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 bg-neutral-950/95 backdrop-blur-2xl transition-all duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        <div className="pt-24 px-6">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-xl text-neutral-300 hover:text-white py-4 border-b border-white/[0.04] transition-all duration-200"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link
            href="#"
            className="mt-8 block text-center bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3.5 rounded-xl transition-colors"
            onClick={() => setMobileOpen(false)}
          >
            Open Studio
          </Link>
        </div>
      </div>
    </>
  );
}
