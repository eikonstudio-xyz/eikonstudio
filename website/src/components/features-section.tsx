"use client";

import { Shield, Zap, Code2, Layers, GitBranch, Package } from "lucide-react";
import { useInView } from "@/hooks/use-in-view";

const features = [
  {
    icon: Code2,
    title: "TypeScript First",
    description:
      "Every package is written in strict TypeScript with full type inference — no @types wrappers, no any casts.",
  },
  {
    icon: Zap,
    title: "Bun Powered",
    description:
      "Built, tested, and published with Bun for sub-second installs and lightning-fast local development.",
  },
  {
    icon: Layers,
    title: "Dual ESM + CJS",
    description:
      "Ship ESM and CommonJS from the same source. Every package works in Node, Bun, Deno, and bundlers out of the box.",
  },
  {
    icon: Shield,
    title: "AI SDK Compatible",
    description:
      "nano integrates directly with the Vercel AI SDK for tool calling, streaming, and structured output.",
  },
  {
    icon: Package,
    title: "Small & Focused",
    description:
      "Each package does one thing well. No monolithic frameworks — compose only the pieces you need.",
  },
  {
    icon: GitBranch,
    title: "Open Source",
    description:
      "All packages are MIT licensed and developed in the open. Contribute, fork, or just read the source.",
  },
];

export function FeaturesSection() {
  const { ref, isInView } = useInView({ threshold: 0.05 });

  return (
    <section id="about" ref={ref} className="relative px-6 py-32">
      <div className="mx-auto max-w-7xl">
        <div
          className={`text-center mb-16 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
        >
          <span className="text-xs tracking-[0.2em] uppercase text-emerald-400 font-medium">
            Why Eikon Studio
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl lg:text-5xl font-mono font-medium tracking-tight">
            Built different, on purpose
          </h2>
          <p className="mt-4 text-neutral-400 text-lg max-w-xl mx-auto">
            We&apos;re an AI-native agency that ships developer tools — opinionated, typed, and designed to
            compose.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className={`group bg-[#111] border border-white/[0.06] rounded-2xl p-7 transition-all duration-500 hover:border-emerald-500/20 hover:bg-[#131313] ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: `${150 + i * 80}ms` }}
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-5 group-hover:bg-emerald-500/15 transition-colors">
                <feature.icon className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-white font-semibold text-[15px] mb-2">{feature.title}</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
