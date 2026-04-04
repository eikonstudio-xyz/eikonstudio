"use client";

import { Database, Image, Terminal, Blocks, Copy, Check } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";
import { useState } from "react";

const packages = [
  {
    name: "@eikonstudio/nano",
    icon: Image,
    description:
      "Strongly typed Gemini and Imagen helpers for generation, editing, composition, and AI SDK tool usage.",
    install: "bun add @eikonstudio/nano",
    tag: "AI / Images",
  },
  {
    name: "@eikonstudio/bqquery",
    icon: Database,
    description:
      "Type-safe BigQuery helpers with a tiny bq() client and ergonomic query(), one(), and value() calls.",
    install: "bun add @eikonstudio/bqquery",
    tag: "Data",
  },
  {
    name: "@eikonstudio/ports",
    icon: Terminal,
    description:
      "Give open local TCP ports memorable names, inspect them quickly, and close them from a CLI or API.",
    install: "bun add @eikonstudio/ports",
    tag: "DevTools",
  },
  {
    name: "@eikonstudio/variant",
    icon: Blocks,
    description:
      "Headless React primitives for switching between full landing page variants with persistence and SSR safety.",
    install: "bun add @eikonstudio/variant",
    tag: "React",
  },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="text-neutral-600 hover:text-neutral-300 transition-colors"
      aria-label="Copy install command"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-400" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}

export function PackagesSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="packages" ref={ref} className="relative px-6 py-32 border-t border-white/[0.04]">
      <div className="mx-auto max-w-7xl">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <span className="text-xs tracking-[0.2em] uppercase text-emerald-400 font-medium">
            Products
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-mono font-medium tracking-tight">
            Our packages
          </h2>
          <p className="mt-4 text-neutral-400 text-lg max-w-xl mx-auto">
            Every package we ship is scoped under{" "}
            <code className="text-emerald-400 text-base font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">
              @eikonstudio
            </code>{" "}
            and published to npm.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {packages.map((pkg, i) => (
            <div
              key={pkg.name}
              className={`group bg-[#111] border border-white/[0.06] rounded-2xl p-7 transition-all duration-500 hover:border-emerald-500/15 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${150 + i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/15 transition-colors">
                    <pkg.icon className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="font-mono text-sm text-white font-medium">{pkg.name}</span>
                </div>
                <span className="text-[11px] font-medium text-neutral-500 bg-white/[0.04] px-2 py-0.5 rounded-full">
                  {pkg.tag}
                </span>
              </div>
              <p className="text-neutral-500 text-sm leading-relaxed mb-5">{pkg.description}</p>
              <div className="bg-neutral-900/50 border border-white/[0.04] rounded-lg px-3 py-2.5 font-mono text-xs text-neutral-400 flex items-center justify-between gap-2">
                <span className="truncate">$ {pkg.install}</span>
                <CopyButton text={pkg.install} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
