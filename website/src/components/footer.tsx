import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  Products: [
    { label: "@eikonstudio/nano", href: "#packages" },
    { label: "@eikonstudio/bqquery", href: "#packages" },
    { label: "@eikonstudio/ports", href: "#packages" },
    { label: "@eikonstudio/variant", href: "#packages" },
  ],
  Resources: [
    { label: "Documentation", href: "https://github.com/eikonstudio-xyz/eikonstudio" },
    { label: "Getting Started", href: "https://github.com/eikonstudio-xyz/eikonstudio" },
    { label: "Changelog", href: "https://github.com/eikonstudio-xyz/eikonstudio/releases" },
    { label: "npm", href: "https://www.npmjs.com/org/eikonstudio" },
  ],
  Company: [
    { label: "About", href: "#about" },
    { label: "Open Source", href: "https://github.com/eikonstudio-xyz" },
    { label: "Brand", href: "/brand" },
    { label: "Contact", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "MIT License", href: "https://github.com/eikonstudio-xyz/eikonstudio/blob/main/LICENSE" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.04] px-6 pt-16 pb-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <Image src="/logo.png" alt="Eikon Studio" width={28} height={28} />
              <span className="text-[15px] font-semibold tracking-tight text-white">
                Eikon Studio
              </span>
            </Link>
            <p className="text-sm text-neutral-500 leading-relaxed max-w-xs">
              AI-native agency shipping typed developer tools.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-xs tracking-[0.15em] uppercase text-neutral-400 font-medium mb-4">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-neutral-500 hover:text-neutral-300 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.04]">
          <p className="text-xs text-neutral-600">
            &copy; {new Date().getFullYear()} Eikon Studio. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/eikonstudio-xyz/eikonstudio"
              className="text-neutral-600 hover:text-neutral-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
            </a>
            <a
              href="https://www.npmjs.com/org/eikonstudio"
              className="text-neutral-600 hover:text-neutral-400 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="npm"
            >
              <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M0 0v16h16V0H0zm13 13H8V5h-2v8H3V3h10v10z" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
