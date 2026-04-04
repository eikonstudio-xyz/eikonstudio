import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";

export function Hero() {
  return (
    <section className="relative flex flex-col items-center justify-center px-6 pt-28 pb-32 overflow-hidden">
      <div className="absolute inset-0 grid-bg" />
      <div className="absolute inset-0 hero-glow" />

      <div className="relative z-10 flex flex-col items-center text-center max-w-5xl">
        <div className="animate-fade-in-up flex items-center gap-2.5 text-xs tracking-[0.2em] uppercase mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-neutral-500 font-medium">@eikonstudio/nano v0.5 shipped</span>
          <Link
            href="https://github.com/eikonstudio-xyz/eikonstudio"
            className="text-emerald-400 font-medium hover:text-emerald-300 transition-colors"
          >
            — See changelog
          </Link>
        </div>

        <h1
          className="animate-fade-in-up font-mono text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.08] tracking-[-0.02em]"
          style={{ animationDelay: "100ms" }}
        >
           Tools for
          <br />
          the AI era
        </h1>

        <p
          className="animate-fade-in-up mt-5 text-neutral-400 text-base md:text-lg max-w-2xl leading-relaxed"
          style={{ animationDelay: "200ms" }}
        >
          Eikon Studio is an AI-native agency shipping small, focused TypeScript packages — from
          BigQuery helpers to Gemini image workflows, built for developers who ship fast.
        </p>

        <div
          className="animate-fade-in-up flex flex-col sm:flex-row items-center gap-4 mt-8"
          style={{ animationDelay: "300ms" }}
        >
          <Link
            href="#packages"
            className="group flex items-center gap-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-7 py-3.5 rounded-xl transition-all duration-200 hover:shadow-[0_0_30px_rgba(16,185,129,0.25)]"
          >
            Explore Products
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="https://github.com/eikonstudio-xyz/eikonstudio"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2.5 border border-neutral-700 hover:border-neutral-500 text-white font-medium px-7 py-3.5 rounded-xl transition-all duration-200 hover:bg-white/[0.03]"
          >
            <BookOpen className="w-4 h-4 text-neutral-400 group-hover:text-neutral-300 transition-colors" />
            Read Docs
          </Link>
        </div>
      </div>
    </section>
  );
}
