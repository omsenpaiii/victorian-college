type SetupNoticeProps = {
  title: string;
  items: string[];
};

export function SetupNotice({ title, items }: SetupNoticeProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef8ff] px-5">
      <div className="max-w-xl rounded-[1.5rem] border border-[#18aee5]/15 bg-white p-8 text-center shadow-[0_24px_70px_rgba(0,74,143,0.12)]">
        <p className="mb-3 text-sm font-black uppercase tracking-[0.28em] text-[#0067b1]">
          Setup required
        </p>
        <h1 className="text-3xl font-black text-[#020d24]">{title}</h1>
        <div className="mt-6 space-y-2 text-left">
          {items.map((item) => (
            <code
              key={item}
              className="block rounded-xl bg-[#eef8ff] px-4 py-3 text-sm font-bold text-[#123e95]"
            >
              {item}
            </code>
          ))}
        </div>
      </div>
    </main>
  );
}
