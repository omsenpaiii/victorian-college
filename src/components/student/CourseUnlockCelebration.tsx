"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Sparkles, X } from "lucide-react";

type CourseUnlockCelebrationProps = {
  courseTitle: string;
  isCourseWorkflow?: boolean;
};

const confettiColors = ["#0f6eb8", "#18aee5", "#f5b800", "#20c997", "#ffffff"];

export function CourseUnlockCelebration({
  courseTitle,
  isCourseWorkflow = false,
}: CourseUnlockCelebrationProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const open = searchParams.get("unlocked") === "1";
  const pieces = useMemo(
    () =>
      Array.from({ length: 34 }, (_, index) => ({
        id: index,
        left: `${8 + ((index * 11) % 84)}%`,
        delay: (index % 9) * 0.08,
        duration: 1.9 + (index % 5) * 0.16,
        rotate: index % 2 === 0 ? 28 : -28,
        color: confettiColors[index % confettiColors.length],
      })),
    [],
  );

  function closeCelebration() {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("unlocked");
    const query = next.toString();

    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center overflow-hidden bg-[#04162b]/58 px-5 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {pieces.map((piece) => (
              <motion.span
                key={piece.id}
                className="absolute top-[-24px] h-3 w-2 rounded-[3px]"
                style={{ left: piece.left, backgroundColor: piece.color }}
                initial={{ y: -24, opacity: 0, rotate: 0 }}
                animate={{
                  y: "105vh",
                  opacity: [0, 1, 1, 0],
                  rotate: piece.rotate * 8,
                  x: piece.rotate,
                }}
                transition={{
                  duration: piece.duration,
                  delay: piece.delay,
                  ease: "easeOut",
                }}
              />
            ))}
          </div>

          <motion.section
            className="relative w-full max-w-xl overflow-hidden rounded-[24px] border border-white/70 bg-white p-7 text-center shadow-[0_30px_90px_rgba(0,0,0,0.28)] sm:p-9"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
          >
            <button
              type="button"
              onClick={closeCelebration}
              className="absolute right-4 top-4 inline-flex size-9 items-center justify-center rounded-full border border-[#dbe7f2] bg-white text-[#5d7389] transition hover:text-[#081221]"
              aria-label="Close celebration"
            >
              <X size={17} />
            </button>

            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-[#e7fff1] text-emerald-600">
              <CheckCircle2 size={34} />
            </div>
            <p className="mt-5 inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[#0f6eb8]">
              <Sparkles size={15} />
              Access unlocked
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081221] sm:text-4xl">
              {isCourseWorkflow ? "Course assessments are unlocked" : `${courseTitle} is unlocked`}
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm font-semibold leading-6 text-[#5d7389]">
              {isCourseWorkflow
                ? "You can now open the remaining clusters, review the resources, and keep moving through your assessments."
                : "Your course workspace is ready. You can start learning from here."}
            </p>

            <button
              type="button"
              onClick={closeCelebration}
              className="mt-7 inline-flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#0f6eb8] px-5 text-sm font-black text-white shadow-[0_14px_28px_rgba(15,110,184,0.2)] transition hover:bg-[#0b5f9f]"
            >
              {isCourseWorkflow ? "Continue to activities" : "Start course"}
              <ArrowRight size={16} />
            </button>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
