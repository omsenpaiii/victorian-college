import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { primaryLinks, siteInfo } from "@/lib/site-content";

export function SiteFooter() {
  return <footer className="bg-[#071b3e] px-5 pb-10 pt-20 text-white sm:px-8">
    <div className="mx-auto max-w-6xl">
      <div className="grid gap-12 border-b border-white/10 pb-14 md:grid-cols-[1.3fr_.7fr_.9fr]">
        <div>
          <Link href="/" className="flex items-center gap-4"><span className="relative size-20 overflow-hidden rounded-full bg-white"><Image src="/vic-logo.png" alt="Victorian College of Knowledge crest" fill sizes="80px" className="object-contain" /></span><span className="font-serif text-2xl leading-tight">Victorian College<br/><span className="text-base tracking-[.16em] text-[#e0bb58]">of Knowledge</span></span></Link>
          <p className="mt-6 max-w-md text-sm leading-7 text-white/65">Practical learning, personal support and clear pathways for your next chapter in Melbourne.</p>
        </div>
        <div><h2 className="text-xs font-bold uppercase tracking-[.2em] text-[#e0bb58]">Explore</h2><div className="mt-5 grid gap-3">{primaryLinks.map((link) => <Link key={link.href} href={link.href} className="text-sm text-white/70 hover:text-white">{link.label}</Link>)}</div></div>
        <div><h2 className="text-xs font-bold uppercase tracking-[.2em] text-[#e0bb58]">Contact</h2><div className="mt-5 grid gap-4 text-sm text-white/70"><a href={`mailto:${siteInfo.email}`} className="flex gap-3"><Mail size={17}/>{siteInfo.email}</a><a href={siteInfo.phoneHref} className="flex gap-3"><Phone size={17}/>{siteInfo.phone}</a><p className="flex gap-3"><MapPin size={17} className="shrink-0"/>{siteInfo.address}</p></div></div>
      </div>
      <div className="flex flex-col gap-2 pt-7 text-xs text-white/45 sm:flex-row sm:justify-between"><p>© {new Date().getFullYear()} Victorian College of Knowledge.</p><p>Institutional details are currently being finalised.</p></div>
    </div>
  </footer>;
}
