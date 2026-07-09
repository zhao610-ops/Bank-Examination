import Link from "next/link";


const links = [
  { href: "/training", label: "训练" },
  { href: "/web-question-search", label: "AI 真题检索" },
  { href: "/plan", label: "备考计划" },
  { href: "/wrong", label: "错题本" },
  { href: "/stats", label: "能力分析" }
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">B</span>
          <span>BankExam AI</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex" aria-label="主导航">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-brand-700">
              {item.label}
            </Link>
          ))}
        </nav>
        <Link href="/training" className="link-button px-3 sm:px-4">开始训练</Link>
      </div>
      <nav className="flex justify-center gap-7 border-t border-slate-100 py-2 text-sm text-slate-600 md:hidden" aria-label="移动端导航">
        {links.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
      </nav>
    </header>
  );
}
