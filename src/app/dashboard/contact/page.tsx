import Link from "next/link";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { siteInfo } from "@/lib/site-content";

export default function ContactPage() {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.02fr_0.98fr]">
      <section className="portal-card rounded-[28px] p-7 sm:p-8">
        <p className="portal-section-label">Contact</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-[#081221]">
          Reach the VCK team when you need a hand.
        </h2>
        <p className="portal-page-copy mt-3 max-w-3xl">
          Use the details below for course support, scheduling questions, access issues, or student guidance.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Email", value: siteInfo.email, href: `mailto:${siteInfo.email}`, icon: Mail },
            { label: "Phone", value: siteInfo.phone, href: siteInfo.phoneHref, icon: Phone },
            { label: "Campus", value: siteInfo.address, href: "/contact", icon: MapPin },
          ].map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="portal-subtle-card rounded-[20px] p-5"
            >
              <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
                <item.icon size={20} />
              </div>
              <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-[#7f92a5]">
                {item.label}
              </p>
              <p className="mt-2 text-base font-black text-[#081221]">{item.value}</p>
            </Link>
          ))}
          <div className="portal-subtle-card rounded-[20px] p-5">
            <div className="flex size-11 items-center justify-center rounded-[16px] bg-[#eef5fb] text-[#0f6eb8]">
              <MessageCircle size={20} />
            </div>
            <p className="mt-4 text-sm font-black uppercase tracking-[0.16em] text-[#7f92a5]">IT Support — {siteInfo.itSupport.name}</p>
            <p className="mt-2 text-base font-black text-[#081221]">{siteInfo.itSupport.phone}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={siteInfo.itSupport.phoneHref} className="portal-button-secondary inline-flex items-center gap-2 px-3 py-2 text-xs">
                <Phone size={14} /> Call
              </a>
              <a href={siteInfo.itSupport.whatsappHref} target="_blank" rel="noreferrer" className="portal-button-primary inline-flex items-center gap-2 px-3 py-2 text-xs">
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <article className="portal-card rounded-[28px] p-7">
          <h3 className="text-2xl font-black tracking-tight text-[#081221]">Best reasons to contact us</h3>
          <div className="mt-5 grid gap-3">
            {[
              "Trouble opening a course or resource",
              "Need help understanding the next activity",
              "Questions about enrolment or verification",
              "Support with scheduling or practical training requirements",
            ].map((item) => (
              <div
                key={item}
                className="portal-subtle-card rounded-[16px] px-4 py-3 text-sm font-black text-[#081221]"
              >
                {item}
              </div>
            ))}
          </div>
        </article>

        <article className="portal-card rounded-[28px] p-7">
          <h3 className="text-2xl font-black tracking-tight text-[#081221]">Need the public contact page?</h3>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#5d7389]">
            If you want the broader website contact page with extra academy context, you can open it directly from here.
          </p>
          <Link
            href="/contact"
            className="portal-button-primary mt-5 inline-flex px-5 py-3 text-sm"
          >
            Open public contact page
          </Link>
        </article>
      </section>
      <p className="text-right text-xs font-semibold text-[#7d90a5] xl:col-span-2">Powered by Buildshoot</p>
    </div>
  );
}
