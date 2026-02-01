import Image from "next/image";
import { Link } from "react-router-dom";
import { Lock, FileText, HelpCircle } from "lucide-react";

const BRAND = "Luxeyline";

export function AuthCardHeader() {
  return (
    <header className="flex justify-center pt-8">
      <Link to="/" className="flex items-center gap-2">
        <Image src="/Logo.png" alt="" width={40} height={40} className="rounded-lg object-contain" />
        <span className="text-xl font-bold text-[#1e293b]">{BRAND}</span>
      </Link>
    </header>
  );
}

export function AuthCardFooter() {
  return (
    <footer className="mt-auto flex flex-wrap items-center justify-between gap-4 border-t border-[#e2e8f0] bg-transparent px-6 py-4">
      <p className="text-sm text-[#64748b]">
        © {new Date().getFullYear()} {BRAND}. All right reserved.
      </p>
      <nav className="flex items-center gap-6">
        <Link to="/privacy" className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#21438D]">
          <Lock className="size-4" />
          Privacy
        </Link>
        <Link to="/terms" className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#21438D]">
          <FileText className="size-4" />
          Terms
        </Link>
        <Link to="/help" className="flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#21438D]">
          <HelpCircle className="size-4" />
          Get help
        </Link>
      </nav>
    </footer>
  );
}
