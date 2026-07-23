import Link from "next/link";
import { ArrowRight, BookOpenText, ExternalLink, LifeBuoy } from "lucide-react";
import { buildUsefulLinks } from "@/lib/student-portal";

export default function UsefulLinksPage() {
  const links = buildUsefulLinks();

  return (
    <div className="space-y-6">
      <section className="portal-card rounded-[28px] p-7 sm:p-8">
        <p className="portal-section-label">Useful links</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081221]">
          Keep your important student resources close.
        </h2>
        <p className="portal-page-copy mt-3 max-w-3xl">
          These are the quickest routes for learning support, course browsing, and student help across the VCK ecosystem.
        </p>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        {links.map((item, index) => (
          <article
            key={item.title}
            className="portal-card rounded-[24px] p-6"
          >
            <div className="flex size-12 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
              {index === 0 ? <BookOpenText size={22} /> : index === 1 ? <ExternalLink size={22} /> : <LifeBuoy size={22} />}
            </div>
            <h3 className="mt-5 text-xl font-black text-[#081221]">{item.title}</h3>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#5d7389]">{item.description}</p>
            <Link
              href={item.href}
              className="portal-button-primary mt-6 inline-flex items-center gap-2 px-5 py-3 text-sm"
            >
              {item.actionLabel}
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}
