import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function CancelPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef8ff] px-5">
      <div className="max-w-xl rounded-[1.5rem] bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,74,143,0.12)]">
        <h1 className="text-4xl font-black text-[#020d24]">Checkout cancelled</h1>
        <p className="mt-4 font-bold leading-7 text-[#53647c]">
          No payment was taken. You can return to VCK and restart enrolment
          whenever you are ready.
        </p>
        <Link
          href="/#courses"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#0067b1] px-6 py-3 text-sm font-black text-white"
        >
          <ArrowLeft size={17} /> Back to courses
        </Link>
      </div>
    </main>
  );
}
