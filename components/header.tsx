import Link from "next/link";
import { Activity, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "#picks", label: "Today's Picks" },
  { href: "#methodology", label: "How It Works" },
  { href: "#risks", label: "Risks" },
  { href: "#performance", label: "Performance" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-background/85 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary ring-1 ring-primary/25">
            <Activity className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="hidden sm:inline">TradeSignal Daily</span>
          <span className="sm:hidden">TSD</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex" aria-label="Primary navigation">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>

        <Button asChild size="sm" variant="outline" className="hidden border-amber-400/30 text-amber-100 hover:bg-amber-400/10 sm:inline-flex">
          <Link href="/disclaimers/">
            <ShieldAlert className="h-4 w-4" aria-hidden="true" />
            Disclaimers
          </Link>
        </Button>
      </div>
    </header>
  );
}
