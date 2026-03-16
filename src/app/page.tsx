"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Sex = "male" | "female";
type Ecog = 0 | 1 | 2 | 3;

interface PRISMInput {
  sex: Sex;
  ecog: Ecog;
  priorSurgery: boolean;
  priorRadiation: boolean;
  organSystemsWithMets: number;
  solitaryBoneDisease: boolean;
  timeDxToMet5Years: boolean;
}

const DEFAULT_INPUT: PRISMInput = {
  sex: "male",
  ecog: 0,
  priorSurgery: false,
  priorRadiation: false,
  organSystemsWithMets: 0,
  solitaryBoneDisease: false,
  timeDxToMet5Years: false,
};

const coxRows = [
  { variable: "Age", uni: "0.990 (0.980\u20131.000)", uniP: "0.0549", multi: "\u2014", multiP: "\u2014" },
  { variable: "Male sex", uni: "0.655 (0.505\u20130.850)", uniP: "0.0015", multi: "0.711 (0.542\u20130.933)", multiP: "0.0140" },
  { variable: "Primary histology", uni: "0.982 (0.946\u20131.020)", uniP: "0.3480", multi: "\u2014", multiP: "\u2014" },
  { variable: "BED10", uni: "1.010 (1.000\u20131.020)", uniP: "0.0577", multi: "\u2014", multiP: "\u2014" },
  { variable: "ECOG", uni: "2.420 (2.080\u20132.810)", uniP: "<0.0001", multi: "4.124 (2.932\u20135.801)", multiP: "<0.0001" },
  { variable: "Spinal level treated", uni: "0.913 (0.768\u20131.080)", uniP: "0.2990", multi: "\u2014", multiP: "\u2014" },
  { variable: "Prior surgery", uni: "1.110 (0.809\u20131.530)", uniP: "0.5110", multi: "\u2014", multiP: "\u2014" },
  { variable: "Prior RT", uni: "0.645 (0.403\u20131.030)", uniP: "0.0679", multi: "\u2014", multiP: "\u2014" },
  { variable: "Number of organs involved", uni: "1.530 (1.360\u20131.720)", uniP: "<0.0001", multi: "1.338 (1.149\u20131.559)", multiP: "0.0002" },
  { variable: "Solitary bone metastasis", uni: "0.512 (0.384\u20130.683)", uniP: "<0.0001", multi: "0.729 (0.522\u20131.018)", multiP: "0.0631" },
  { variable: "Brain metastasis", uni: "2.630 (1.670\u20134.160)", uniP: "<0.0001", multi: "1.135 (0.673\u20131.913)", multiP: "0.6350" },
  { variable: "Treatment latency", uni: "0.969 (0.946\u20130.992)", uniP: "0.0087", multi: "0.973 (0.951\u20130.995)", multiP: "0.0155" },
];

const formatScore = (score: number) =>
  Number.isInteger(score) ? score.toString() : score.toFixed(1);

const scoreFromInput = (input: PRISMInput) => {
  let score = 0;
  if (input.sex === "female") score += 2;
  if (input.ecog === 0) score += 3.5;
  else if (input.ecog === 1) score += 1.5;
  else if (input.ecog === 2) score += 0.5;
  if (input.priorSurgery) score += 1;
  if (input.priorRadiation) score -= 1;
  score -= input.organSystemsWithMets;
  if (input.solitaryBoneDisease) score += 3;
  if (input.timeDxToMet5Years) score += 3;
  return score;
};

const groupFromScore = (score: number) => {
  if (score > 7) return { group: "Group 1", prognosis: "Excellent", color: "#16a34a", bg: "bg-green-50", border: "border-green-200", text: "text-green-800", chip: "bg-green-100 text-green-800" };
  if (score >= 4) return { group: "Group 2", prognosis: "Good", color: "#ca8a04", bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", chip: "bg-yellow-100 text-yellow-800" };
  if (score >= 1) return { group: "Group 3", prognosis: "Intermediate", color: "#ea580c", bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", chip: "bg-orange-100 text-orange-800" };
  return { group: "Group 4", prognosis: "Poor", color: "#dc2626", bg: "bg-red-50", border: "border-red-200", text: "text-red-800", chip: "bg-red-100 text-red-800" };
};

const contributionsFromInput = (input: PRISMInput) => [
  { label: "Sex", detail: input.sex === "female" ? "Female" : "Male", value: input.sex === "female" ? 2 : 0 },
  { label: "ECOG", detail: `Status ${input.ecog}`, value: input.ecog === 0 ? 3.5 : input.ecog === 1 ? 1.5 : input.ecog === 2 ? 0.5 : 0 },
  { label: "Prior surgery", detail: input.priorSurgery ? "Yes" : "No", value: input.priorSurgery ? 1 : 0 },
  { label: "Prior radiation", detail: input.priorRadiation ? "Yes" : "No", value: input.priorRadiation ? -1 : 0 },
  { label: "Other organ systems with metastasis", detail: `${input.organSystemsWithMets}`, value: -input.organSystemsWithMets },
  { label: "Solitary bone disease", detail: input.solitaryBoneDisease ? "Yes" : "No", value: input.solitaryBoneDisease ? 3 : 0 },
  { label: "Time from diagnosis to metastasis >5 years", detail: input.timeDxToMet5Years ? "Yes" : "No", value: input.timeDxToMet5Years ? 3 : 0 },
];

const useInView = () => {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } }, { threshold: 0.15 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, isVisible };
};

export default function Home() {
  const [input, setInput] = useState<PRISMInput>(DEFAULT_INPUT);
  const [warning, setWarning] = useState<string | null>(null);

  const score = useMemo(() => scoreFromInput(input), [input]);
  const group = useMemo(() => groupFromScore(score), [score]);
  const breakdown = useMemo(() => contributionsFromInput(input), [input]);

  const hero = useInView();
  const calc = useInView();
  const about = useInView();
  const reference = useInView();

  const handleOrganChange = (value: number) => {
    const clamped = Math.max(0, Math.floor(Number.isNaN(value) ? 0 : value));
    if (input.solitaryBoneDisease && clamped > 0) {
      setWarning("Solitary bone disease requires 0 other organ systems. It has been deselected.");
      setInput((prev) => ({ ...prev, organSystemsWithMets: clamped, solitaryBoneDisease: false }));
      return;
    }
    setWarning(null);
    setInput((prev) => ({ ...prev, organSystemsWithMets: clamped }));
  };

  const handleSolitaryChange = (checked: boolean) => {
    if (checked && input.organSystemsWithMets > 0) {
      setWarning("Solitary bone disease requires 0 other organ systems. The organ count has been reset to 0.");
      setInput((prev) => ({ ...prev, solitaryBoneDisease: true, organSystemsWithMets: 0 }));
      return;
    }
    setWarning(null);
    setInput((prev) => ({ ...prev, solitaryBoneDisease: checked }));
  };

  const Toggle = ({ label, value, onChange, options = ["Yes", "No"] }: { label: string; value: boolean; onChange: (v: boolean) => void; options?: [string, string] }) => (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        {[true, false].map((v, i) => (
          <button key={v ? "yes" : "no"} type="button" onClick={() => onChange(v)}
            className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
              value === v
                ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >{options[i]}</button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header bar */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 sm:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">P</div>
            <span className="text-lg font-semibold text-gray-900">PRISM</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-500">
            <a href="#calculator" className="hover:text-gray-900 transition-colors">Calculator</a>
            <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
            <a href="#reference" className="hover:text-gray-900 transition-colors">Reference</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-6 pb-20 pt-12 sm:px-10">
        {/* Hero */}
        <section
          ref={hero.ref as React.RefObject<HTMLElement>}
          className={`flex flex-col gap-4 ${hero.isVisible ? "fade-in-up" : "opacity-0 translate-y-3"}`}
        >
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-blue-600">
            <span className="h-px w-8 bg-blue-600" />
            Clinical Calculator
          </div>
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Prognostic Index for<br className="hidden sm:block" /> Spinal Metastases
          </h1>
          <p className="max-w-2xl text-base leading-relaxed text-gray-500">
            A validated prognostic tool for patients receiving spine SBRT. Developed at Mayo Clinic, externally validated at MD Anderson Cancer Center.
          </p>
        </section>

        {/* Calculator */}
        <section
          id="calculator"
          ref={calc.ref as React.RefObject<HTMLElement>}
          className={`grid gap-8 lg:grid-cols-[1.15fr_0.85fr] ${calc.isVisible ? "fade-in-up fade-delay-1" : "opacity-0 translate-y-3"}`}
        >
          {/* Input panel */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900">Calculator</h2>
            <p className="mt-1 text-sm text-gray-500">Enter clinical variables. Score updates in real time.</p>

            <div className="mt-6 grid gap-5">
              {/* Sex */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Sex</label>
                <div className="flex gap-2">
                  {(["male", "female"] as Sex[]).map((option) => (
                    <button key={option} type="button" onClick={() => setInput((prev) => ({ ...prev, sex: option }))}
                      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                        input.sex === option
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >{option === "male" ? "Male" : "Female"}</button>
                  ))}
                </div>
              </div>

              {/* ECOG */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">ECOG Performance Status</label>
                <div className="grid grid-cols-4 gap-2">
                  {([0, 1, 2, 3] as Ecog[]).map((value) => (
                    <button key={value} type="button" onClick={() => setInput((prev) => ({ ...prev, ecog: value }))}
                      className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-all ${
                        input.ecog === value
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >{value}</button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">ECOG 3 or greater contributes 0 points.</p>
              </div>

              <Toggle label="Prior surgery at SBRT site" value={input.priorSurgery} onChange={(v) => setInput((prev) => ({ ...prev, priorSurgery: v }))} />
              <Toggle label="Prior radiation at SBRT site" value={input.priorRadiation} onChange={(v) => setInput((prev) => ({ ...prev, priorRadiation: v }))} />

              {/* Organ systems */}
              <div className="grid gap-2">
                <label className="text-sm font-medium text-gray-700">Other organ systems with metastasis (excluding bone)</label>
                <input
                  type="number" min={0} value={input.organSystemsWithMets}
                  onChange={(e) => handleOrganChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
                <p className="text-xs text-gray-400">Count distinct non-bone organ systems (lung, liver, brain, etc.).</p>
              </div>

              <Toggle label="Solitary bone disease (no other organ mets)" value={input.solitaryBoneDisease} onChange={handleSolitaryChange} />
              <Toggle label="Time from diagnosis to metastasis >5 years" value={input.timeDxToMet5Years} onChange={(v) => setInput((prev) => ({ ...prev, timeDxToMet5Years: v }))} />
            </div>

            {warning && (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {warning}
              </div>
            )}
          </div>

          {/* Results panel */}
          <div className="flex flex-col gap-6">
            {/* Score card */}
            <div className={`rounded-2xl border ${group.border} ${group.bg} p-6 sm:p-8 shadow-sm transition-all`}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">PRISM Score</p>
                  <div className="mt-2 text-5xl font-bold" style={{ color: group.color }}>
                    {formatScore(score)}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${group.chip}`}>
                      {group.group}
                    </span>
                    <span className={`text-sm font-medium ${group.text}`}>
                      {group.prognosis} prognosis
                    </span>
                  </div>
                </div>
                <div className="h-16 w-2 rounded-full" style={{ backgroundColor: group.color }} aria-hidden="true" />
              </div>
              <div className="mt-5 rounded-xl bg-white/60 border border-gray-200/50 px-4 py-3 text-xs text-gray-500">
                Thresholds: &gt;7 (Excellent) | 4-7 (Good) | 1-3 (Intermediate) | &lt;1 (Poor)
              </div>
            </div>

            {/* Breakdown */}
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900">Score Breakdown</h3>
              <div className="mt-3 space-y-2">
                {breakdown.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm">
                    <div>
                      <p className="text-gray-800 font-medium">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.detail}</p>
                    </div>
                    <div className={`text-sm font-bold tabular-nums ${
                      item.value > 0 ? "text-green-600" : item.value < 0 ? "text-red-500" : "text-gray-400"
                    }`}>
                      {item.value > 0 ? `+${formatScore(item.value)}` : formatScore(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* About */}
        <section
          id="about"
          ref={about.ref as React.RefObject<HTMLElement>}
          className={`rounded-2xl border border-gray-200 bg-gray-50 p-8 sm:p-10 ${about.isVisible ? "fade-in-up fade-delay-2" : "opacity-0 translate-y-3"}`}
        >
          <h2 className="text-xl font-semibold text-gray-900">About PRISM</h2>
          <div className="mt-4 space-y-3 text-sm leading-relaxed text-gray-600">
            <p>
              PRISM (Prognostic Index for Spinal Metastases) is a validated prognostic model for patients undergoing stereotactic body radiation therapy to the spine. It combines readily available clinical variables into a composite score to stratify outcomes into four prognostic groups.
            </p>
            <p>
              The model was developed at Mayo Clinic and externally validated in MD Anderson Cancer Center cohorts. It is intended to support clinical discussions and treatment planning rather than replace clinical judgment.
            </p>
          </div>
        </section>

        {/* Reference */}
        <section
          id="reference"
          ref={reference.ref as React.RefObject<HTMLElement>}
          className={`${reference.isVisible ? "fade-in-up fade-delay-3" : "opacity-0 translate-y-3"}`}
        >
          <details className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
            <summary className="cursor-pointer list-none text-base font-semibold text-gray-900 flex items-center justify-between">
              Reference -- Cox Regression Table (Mayo Cohort)
              <svg className="h-5 w-5 text-gray-400 transition-transform details-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </summary>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                    <th className="py-3 pr-4 font-semibold">Variable</th>
                    <th className="py-3 pr-4 font-semibold">Univariate HR (95% CI)</th>
                    <th className="py-3 pr-4 font-semibold">P value</th>
                    <th className="py-3 pr-4 font-semibold">Multivariable HR (95% CI)</th>
                    <th className="py-3 pr-4 font-semibold">P value</th>
                  </tr>
                </thead>
                <tbody>
                  {coxRows.map((row, i) => (
                    <tr key={row.variable} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                      <td className="py-3 pr-4 font-medium text-gray-800">{row.variable}</td>
                      <td className="py-3 pr-4 text-gray-600 tabular-nums">{row.uni}</td>
                      <td className="py-3 pr-4 text-gray-600">{row.uniP}</td>
                      <td className="py-3 pr-4 text-gray-600 tabular-nums">{row.multi}</td>
                      <td className="py-3 pr-4 text-gray-600">{row.multiP}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      </main>

      <footer className="border-t border-gray-100 bg-gray-50 px-6 py-8 text-xs text-gray-400 sm:px-10">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
          <p>
            This tool is for educational and clinical decision-support purposes only. It does not constitute medical advice. Clinical decisions should be made by qualified professionals using the full clinical context.
          </p>
          <p>
            PRISM -- Prognostic Index for Spinal Metastases. Mayo Clinic development, MD Anderson external validation.
          </p>
        </div>
      </footer>
    </div>
  );
}
