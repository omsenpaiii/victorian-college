"use client";

import { motion, useReducedMotion } from "framer-motion";

export function MotionReveal({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return <motion.div initial={reduceMotion ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-70px" }} transition={{ duration: .65, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>;
}
