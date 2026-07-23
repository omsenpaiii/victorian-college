import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MotionReveal } from "@/components/MotionReveal";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { benefits } from "@/lib/site-content";

export default function AboutPage() {
  return <main className="bg-white text-[#071b3e]"><SiteHeader />
    <section className="bg-[#edf3f8] px-5 pb-24 pt-36 sm:px-8"><div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_.9fr] lg:items-center"><MotionReveal><p className="text-sm font-bold uppercase tracking-[.18em] text-[#a97f16]">About the college</p><h1 className="mt-5 font-serif text-6xl leading-[1.02]">Learning feels different when it starts with the person.</h1><p className="mt-7 max-w-xl text-lg leading-8 text-[#5c6e86]">Victorian College of Knowledge is being shaped as a modern Melbourne learning environment: practical in its approach, personal in its support, and clear about every learner’s next step.</p><Link href="/contact" className="mt-9 inline-flex items-center gap-2 rounded-full bg-[#c79a24] px-6 py-4 font-bold">Start a conversation <ArrowRight size={18}/></Link></MotionReveal><MotionReveal delay={.1} className="relative min-h-[520px] overflow-hidden rounded-[32px]"><Image src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1300&q=88" alt="Students learning together" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover"/></MotionReveal></div></section>
    <section className="px-5 py-28 sm:px-8"><div className="mx-auto max-w-6xl"><div className="grid gap-8 md:grid-cols-3">{benefits.map((benefit) => <article key={benefit.title} className="border-t border-[#cfd9e5] pt-6"><Check className="text-[#b78b18]"/><h2 className="mt-5 font-serif text-3xl">{benefit.title}</h2><p className="mt-4 leading-7 text-[#607087]">{benefit.text}</p></article>)}</div><div className="mt-24 rounded-[32px] bg-[#071b3e] p-9 text-white sm:p-14"><p className="text-sm font-bold uppercase tracking-[.18em] text-[#e0bb58]">A careful beginning</p><h2 className="mt-5 max-w-3xl font-serif text-5xl">Verified details will always come before promises.</h2><p className="mt-6 max-w-3xl leading-8 text-white/65">Course availability, fees, campus information and formal registrations shown on this site remain clearly labelled until confirmed. The current catalogue is demonstration content for the platform.</p></div></div></section>
    <SiteFooter /></main>;
}
