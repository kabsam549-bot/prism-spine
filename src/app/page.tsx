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
  {
    variable: "Age",
    uni: "0.990 (0.980-1.000)",
    uniP: "0.0549",
    multi: "--",
    multiP: "--",
  },
  {
    variable: "Male sex",
    uni: "0.655 (0.505-0.850)",
    uniP: "0.0015",
    multi: "0.711 (0.542-0.933)",
    multiP: "0.0140",
  },
  {
    variable: "Primary histology",
    uni: "0.982 (0.946-1.020)",
    uniP: "0.3480",
    multi: "--",
    multiP: "--",
  },
  {
    variable: "BED10",
    uni: "1.010 (1.000-1.020)",
    uniP: "0.0577",
    multi: "--",
    multiP: "--",
  },
  {
    variable: "ECOG",
    uni: "2.420 (2.080-2.810)",
    uniP: "<0.0001",
    multi: "4.124 (2.932-5.801)",
    multiP: "<0.0001",
  },
  {
    variable: "Spinal level treated",
    uni: "0.913 (0.768-1.080)",
    uniP: "0.2990",
    multi: "--",
    multiP: "--",
  },
  {
    variable: "Prior surgery",
    uni: "1.110 (0.809-1.530)",
    uniP: "0.5110",
    multi: "--",
    multiP: "--",
  },
  {
    variable: "Prior RT",
    uni: "0.645 (0.403-1.030)",
    uniP: "0.0679",
    multi: "--",
    multiP: "--",
  },
  {
    variable: "Number of organs involved",
    uni: "1.530 (1.360-1.720)",
    uniP: "<0.0001",
    multi: "1.338 (1.149-1.559)",
    multiP: "0.0002",
  },
  {
    variable: "Solitary bone metastasis",
    uni: "0.512 (0.384-0.683)",
    uniP: "<0.0001",
    multi: "0.729 (0.522-1.018)",
    multiP: "0.0631",
  },
  {
    variable: "Brain metastasis",
    uni: "2.630 (1.670-4.160)",
    uniP: "<0.0001",
    multi: "1.135 (0.673-1.913)",
    multiP: "0.6350",
  },
  {
    variable: "Treatment latency",
    uni: "0.969 (0.946-0.992)",
    uniP: "0.0087",
    multi: "0.973 (0.951-0.995)",
    multiP: "0.0155",
  },
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
  if (score > 7) {
    return {
      group: "Group 1",
      prognosis: "Excellent",
      color: "#22c55e",
      chip: "bg-[#12331f] text-[#9ae6b4]",
    };
  }
  if (score >= 4) {
    return {
      group: "Group 2",
      prognosis: "Good",
      color: "#facc15",
      chip: "bg-[#3a2f09] text-[#fde68a]",
    };
  }
  if (score >= 1) {
    return {
      group: "Group 3",
      prognosis: "Intermediate",
      color: "#fb923c",
      chip: "bg-[#40200b] text-[#fed7aa]",
    };
  }
  return {
    group: "Group 4",
    prognosis: "Poor",
    color: "#ef4444",
    chip: "bg-[#3a0f0f] text-[#fecaca]",
  };
};

const contributionsFromInput = (input: PRISMInput) => [
  {
    label: "Sex",
    detail: input.sex === "female" ? "Female" : "Male",
    value: input.sex === "female" ? 2 : 0,
  },
  {
    label: "ECOG",
    detail: `Status ${input.ecog}`,
    value: input.ecog === 0 ? 3.5 : input.ecog === 1 ? 1.5 : input.ecog === 2 ? 0.5 : 0,
  },
  {
    label: "Prior surgery",
    detail: input.priorSurgery ? "Yes" : "No",
    value: input.priorSurgery ? 1 : 0,
  },
  {
    label: "Prior radiation",
    detail: input.priorRadiation ? "Yes" : "No",
    value: input.priorRadiation ? -1 : 0,
  },
  {
    label: "Other organ systems with metastasis",
    detail: `${input.organSystemsWithMets}`,
    value: -input.organSystemsWithMets,
  },
  {
    label: "Solitary bone disease",
    detail: input.solitaryBoneDisease ? "Yes" : "No",
    value: input.solitaryBoneDisease ? 3 : 0,
  },
  {
    label: "Time from diagnosis to metastasis >5 years",
    detail: input.timeDxToMet5Years ? "Yes" : "No",
    value: input.timeDxToMet5Years ? 3 : 0,
  },
];

const useInView = () => {
  const ref = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
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
      setWarning(
        "Solitary bone disease requires 0 other organ systems. It has been deselected."
      );
      setInput((prev) => ({
        ...prev,
        organSystemsWithMets: clamped,
        solitaryBoneDisease: false,
      }));
      return;
    }
    setWarning(null);
    setInput((prev) => ({ ...prev, organSystemsWithMets: clamped }));
  };

  const handleSolitaryChange = (checked: boolean) => {
    if (checked && input.organSystemsWithMets > 0) {
      setWarning(
        "Solitary bone disease requires 0 other organ systems. The organ count has been reset to 0."
      );
      setInput((prev) => ({
        ...prev,
        solitaryBoneDisease: true,
        organSystemsWithMets: 0,
      }));
      return;
    }
    setWarning(null);
    setInput((prev) => ({ ...prev, solitaryBoneDisease: checked }));
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div
        className="grid-fade pointer-events-none absolute inset-0 opacity-60"
        aria-hidden="true"
      />
      <main className="relative mx-auto flex w-full max-w-6xl flex-col gap-24 px-6 pb-20 pt-12 sm:px-10 lg:px-16">
        <section
          ref={hero.ref}
          className={`relative flex flex-col gap-8 ${
            hero.isVisible ? "fade-in-up" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex items-center gap-3 text-sm uppercase tracking-[0.32em] text-[#a3a3a3]">
            <span className="h-[1px] w-10 bg-[#e53e3e]" />
            PRISM
          </div>
          <div className="flex flex-col gap-6">
            <h1 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              PRISM — Prognostic Index for Spinal Metastases
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-[#c7c7c7]">
              A validated clinical tool for estimating prognosis in patients
              receiving spine SBRT, grounded in Mayo Clinic and MD Anderson
              cohorts.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-[#a3a3a3]">
            <span className="rounded-full border border-[#2a2a2a] px-4 py-2">
              Real-time scoring
            </span>
            <span className="rounded-full border border-[#2a2a2a] px-4 py-2">
              No data stored
            </span>
            <span className="rounded-full border border-[#2a2a2a] px-4 py-2">
              Clinical reference
            </span>
          </div>
        </section>

        <section
          ref={calc.ref}
          className={`grid gap-10 lg:grid-cols-[1.1fr_0.9fr] ${
            calc.isVisible ? "fade-in-up fade-delay-1" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="rounded-3xl border border-[#1e1e1e] bg-[#0b0b0b] p-8 card-glow">
            <h2 className="text-2xl font-semibold">Calculator</h2>
            <p className="mt-2 text-sm text-[#a3a3a3]">
              Enter the clinical variables below. Scores update automatically.
            </p>
            <div className="mt-8 grid gap-6">
              <div className="grid gap-2">
                <label className="text-sm text-[#c7c7c7]">Sex</label>
                <div className="flex gap-3">
                  {(["male", "female"] as Sex[]).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() =>
                        setInput((prev) => ({ ...prev, sex: option }))
                      }
                      className={`flex-1 rounded-full border px-4 py-2 text-sm transition ${
                        input.sex === option
                          ? "border-[#e53e3e] bg-[#1a0b0b] text-white"
                          : "border-[#2a2a2a] text-[#c7c7c7] hover:border-[#e53e3e]"
                      }`}
                    >
                      {option === "male" ? "Male" : "Female"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-[#c7c7c7]">
                  ECOG Performance Status
                </label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {([0, 1, 2, 3] as Ecog[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setInput((prev) => ({ ...prev, ecog: value }))
                      }
                      className={`rounded-xl border px-4 py-3 text-sm transition ${
                        input.ecog === value
                          ? "border-[#e53e3e] bg-[#1a0b0b] text-white"
                          : "border-[#2a2a2a] text-[#c7c7c7] hover:border-[#e53e3e]"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#7a7a7a]">
                  ECOG 3 or greater contributes 0 points.
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-[#c7c7c7]">
                  Prior surgery at SBRT site
                </label>
                <div className="flex gap-3">
                  {[true, false].map((value) => (
                    <button
                      key={value ? "yes" : "no"}
                      type="button"
                      onClick={() =>
                        setInput((prev) => ({
                          ...prev,
                          priorSurgery: value,
                        }))
                      }
                      className={`flex-1 rounded-full border px-4 py-2 text-sm transition ${
                        input.priorSurgery === value
                          ? "border-[#e53e3e] bg-[#1a0b0b] text-white"
                          : "border-[#2a2a2a] text-[#c7c7c7] hover:border-[#e53e3e]"
                      }`}
                    >
                      {value ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-[#c7c7c7]">
                  Prior radiation at SBRT site
                </label>
                <div className="flex gap-3">
                  {[true, false].map((value) => (
                    <button
                      key={value ? "yes" : "no"}
                      type="button"
                      onClick={() =>
                        setInput((prev) => ({
                          ...prev,
                          priorRadiation: value,
                        }))
                      }
                      className={`flex-1 rounded-full border px-4 py-2 text-sm transition ${
                        input.priorRadiation === value
                          ? "border-[#e53e3e] bg-[#1a0b0b] text-white"
                          : "border-[#2a2a2a] text-[#c7c7c7] hover:border-[#e53e3e]"
                      }`}
                    >
                      {value ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-[#c7c7c7]">
                  Other organ systems with metastasis (excluding bone)
                </label>
                <input
                  type="number"
                  min={0}
                  value={input.organSystemsWithMets}
                  onChange={(event) =>
                    handleOrganChange(Number(event.target.value))
                  }
                  className="w-full rounded-xl border border-[#2a2a2a] bg-[#0f0f0f] px-4 py-3 text-sm text-white focus:border-[#e53e3e] focus:outline-none"
                />
                <p className="text-xs text-[#7a7a7a]">
                  Count distinct non-bone organ systems, such as lung, liver, or
                  brain.
                </p>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-[#c7c7c7]">
                  Solitary bone disease (no other organ mets)
                </label>
                <div className="flex gap-3">
                  {[true, false].map((value) => (
                    <button
                      key={value ? "yes" : "no"}
                      type="button"
                      onClick={() => handleSolitaryChange(value)}
                      className={`flex-1 rounded-full border px-4 py-2 text-sm transition ${
                        input.solitaryBoneDisease === value
                          ? "border-[#e53e3e] bg-[#1a0b0b] text-white"
                          : "border-[#2a2a2a] text-[#c7c7c7] hover:border-[#e53e3e]"
                      }`}
                    >
                      {value ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm text-[#c7c7c7]">
                  Time from diagnosis to metastasis &gt;5 years
                </label>
                <div className="flex gap-3">
                  {[true, false].map((value) => (
                    <button
                      key={value ? "yes" : "no"}
                      type="button"
                      onClick={() =>
                        setInput((prev) => ({
                          ...prev,
                          timeDxToMet5Years: value,
                        }))
                      }
                      className={`flex-1 rounded-full border px-4 py-2 text-sm transition ${
                        input.timeDxToMet5Years === value
                          ? "border-[#e53e3e] bg-[#1a0b0b] text-white"
                          : "border-[#2a2a2a] text-[#c7c7c7] hover:border-[#e53e3e]"
                      }`}
                    >
                      {value ? "Yes" : "No"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {warning ? (
              <div className="mt-6 rounded-2xl border border-[#3b0f0f] bg-[#1a0b0b] px-4 py-3 text-sm text-[#fecaca]">
                {warning}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-[#1e1e1e] bg-[#0b0b0b] p-8 card-glow">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#a3a3a3]">
                    PRISM Score
                  </p>
                  <div className="mt-3 text-5xl font-semibold">
                    {formatScore(score)}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${group.chip}`}
                    >
                      {group.group}
                    </span>
                    <span className="text-sm text-[#c7c7c7]">
                      {group.prognosis} prognosis
                    </span>
                  </div>
                </div>
                <div
                  className="h-16 w-2 rounded-full"
                  style={{ backgroundColor: group.color }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-6 rounded-2xl border border-[#1e1e1e] bg-[#0f0f0f] px-4 py-3 text-sm text-[#a3a3a3]">
                Group thresholds: &gt;7 (Excellent), 4–7 (Good), 1–3
                (Intermediate), &lt;1 (Poor).
              </div>
            </div>

            <div className="rounded-3xl border border-[#1e1e1e] bg-[#0b0b0b] p-6">
              <h3 className="text-lg font-semibold">Score Breakdown</h3>
              <div className="mt-4 space-y-3">
                {breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-[#1e1e1e] bg-[#101010] px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="text-white">{item.label}</p>
                      <p className="text-xs text-[#7a7a7a]">{item.detail}</p>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        item.value > 0
                          ? "text-[#9ae6b4]"
                          : item.value < 0
                          ? "text-[#fecaca]"
                          : "text-[#a3a3a3]"
                      }`}
                    >
                      {item.value > 0 ? `+${formatScore(item.value)}` : formatScore(item.value)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          ref={about.ref}
          className={`rounded-3xl border border-[#1e1e1e] bg-[#0b0b0b] p-10 ${
            about.isVisible ? "fade-in-up fade-delay-2" : "opacity-0 translate-y-4"
          }`}
        >
          <h2 className="text-2xl font-semibold">About PRISM</h2>
          <div className="mt-4 space-y-4 text-sm leading-relaxed text-[#c7c7c7]">
            <p>
              PRISM (Prognostic Index for Spinal Metastases) is a validated
              prognostic model for patients undergoing stereotactic body
              radiation therapy to the spine. It combines readily available
              clinical variables into a composite score to stratify outcomes.
            </p>
            <p>
              The model was developed at Mayo Clinic and externally validated in
              MD Anderson Cancer Center cohorts. It is intended to support
              clinical discussions and treatment planning rather than replace
              clinical judgment.
            </p>
          </div>
        </section>

        <section
          ref={reference.ref}
          className={`${
            reference.isVisible ? "fade-in-up fade-delay-3" : "opacity-0 translate-y-4"
          }`}
        >
          <details className="rounded-3xl border border-[#1e1e1e] bg-[#0b0b0b] p-8">
            <summary className="cursor-pointer list-none text-lg font-semibold text-white">
              Reference — Cox Regression Table
            </summary>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#1e1e1e] text-[#a3a3a3]">
                    <th className="py-3 pr-6 font-medium">Variable</th>
                    <th className="py-3 pr-6 font-medium">
                      Univariate HR (95% CI)
                    </th>
                    <th className="py-3 pr-6 font-medium">P value</th>
                    <th className="py-3 pr-6 font-medium">
                      Multivariable HR (95% CI)
                    </th>
                    <th className="py-3 pr-6 font-medium">P value</th>
                  </tr>
                </thead>
                <tbody>
                  {coxRows.map((row) => (
                    <tr
                      key={row.variable}
                      className="border-b border-[#111111] text-[#c7c7c7]"
                    >
                      <td className="py-3 pr-6 text-white">{row.variable}</td>
                      <td className="py-3 pr-6">{row.uni}</td>
                      <td className="py-3 pr-6">{row.uniP}</td>
                      <td className="py-3 pr-6">{row.multi}</td>
                      <td className="py-3 pr-6">{row.multiP}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      </main>

      <footer className="border-t border-[#1e1e1e] bg-black px-6 py-10 text-sm text-[#7a7a7a] sm:px-10 lg:px-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2">
          <p>
            Disclaimer: This tool is for educational purposes and does not
            constitute medical advice. Clinical decisions should be made by
            qualified professionals using the full clinical context.
          </p>
          <p>
            Citation: PRISM — Prognostic Index for Spinal Metastases (Mayo Clinic
            development; MD Anderson external validation).
          </p>
        </div>
      </footer>
    </div>
  );
}
