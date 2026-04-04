"use client";

import { useInView } from "@/hooks/use-in-view";

export function DemoSection() {
  const { ref, isInView } = useInView({ threshold: 0.15 });

  return (
    <section ref={ref} className="relative px-6 -mt-16 pb-32">
      <div className="mx-auto max-w-5xl">
        <div
          className={`relative rounded-2xl p-px bg-gradient-to-b from-emerald-500/20 via-emerald-500/5 to-transparent transition-all duration-1000 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
        >
          <div className="bg-neutral-950 rounded-2xl p-5 md:p-8">
            <div className="grid md:grid-cols-2 gap-5">
              {/* @eikonstudio/nano */}
              <div
                className={`bg-[#111] rounded-xl border border-white/[0.06] overflow-hidden transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: "200ms" }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="text-[13px] text-neutral-500 ml-2 font-medium">
                      @eikonstudio/nano
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    v0.5.0
                  </span>
                </div>

                <div className="p-4">
                  <pre className="text-[13px] leading-relaxed overflow-x-auto">
                    <code>
                      <span className="text-neutral-500">{"// Generate an image with Imagen 3"}</span>
                      {"\n"}
                      <span className="text-purple-400">{"import"}</span>
                      <span className="text-neutral-300">{" { nano } "}</span>
                      <span className="text-purple-400">{"from"}</span>
                      <span className="text-emerald-400">{' "@eikonstudio/nano"'}</span>
                      <span className="text-neutral-500">;</span>
                      {"\n\n"}
                      <span className="text-purple-400">{"const"}</span>
                      <span className="text-neutral-300">{" image = "}</span>
                      <span className="text-purple-400">{"await"}</span>
                      <span className="text-blue-300">{" nano"}</span>
                      <span className="text-neutral-400">.</span>
                      <span className="text-yellow-300">{"generate"}</span>
                      <span className="text-neutral-400">{"({"}</span>
                      {"\n"}
                      <span className="text-neutral-300">{"  prompt"}</span>
                      <span className="text-neutral-400">{": "}</span>
                      <span className="text-emerald-400">{'"A futuristic city at sunset"'}</span>
                      <span className="text-neutral-400">,</span>
                      {"\n"}
                      <span className="text-neutral-300">{"  style"}</span>
                      <span className="text-neutral-400">{": "}</span>
                      <span className="text-emerald-400">{'"cinematic"'}</span>
                      <span className="text-neutral-400">,</span>
                      {"\n"}
                      <span className="text-neutral-300">{"  resolution"}</span>
                      <span className="text-neutral-400">{": "}</span>
                      <span className="text-emerald-400">{'"4k"'}</span>
                      <span className="text-neutral-400">,</span>
                      {"\n"}
                      <span className="text-neutral-400">{"});"}</span>
                    </code>
                  </pre>
                </div>
              </div>

              {/* @eikonstudio/bqquery */}
              <div
                className={`bg-[#111] rounded-xl border border-white/[0.06] overflow-hidden transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
                style={{ transitionDelay: "400ms" }}
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                    </div>
                    <span className="text-[13px] text-neutral-500 ml-2 font-medium">
                      @eikonstudio/bqquery
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                    v0.3.0
                  </span>
                </div>

                <div className="p-4">
                  <pre className="text-[13px] leading-relaxed overflow-x-auto">
                    <code>
                      <span className="text-neutral-500">{"// Type-safe BigQuery in one call"}</span>
                      {"\n"}
                      <span className="text-purple-400">{"import"}</span>
                      <span className="text-neutral-300">{" { bq } "}</span>
                      <span className="text-purple-400">{"from"}</span>
                      <span className="text-emerald-400">{' "@eikonstudio/bqquery"'}</span>
                      <span className="text-neutral-500">;</span>
                      {"\n\n"}
                      <span className="text-purple-400">{"const"}</span>
                      <span className="text-neutral-300">{" users = "}</span>
                      <span className="text-purple-400">{"await"}</span>
                      <span className="text-blue-300">{" bq"}</span>
                      <span className="text-neutral-400">.</span>
                      <span className="text-yellow-300">{"query"}</span>
                      <span className="text-neutral-400">{"<"}</span>
                      <span className="text-blue-300">{"User"}</span>
                      <span className="text-neutral-400">{">("}</span>
                      <span className="text-emerald-400">{"`"}</span>
                      {"\n"}
                      <span className="text-emerald-400">{"  SELECT name, email, plan"}</span>
                      {"\n"}
                      <span className="text-emerald-400">{"  FROM `analytics.users`"}</span>
                      {"\n"}
                      <span className="text-emerald-400">{"  WHERE active = TRUE"}</span>
                      {"\n"}
                      <span className="text-emerald-400">{"`"}</span>
                      <span className="text-neutral-400">{");"}</span>
                    </code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
