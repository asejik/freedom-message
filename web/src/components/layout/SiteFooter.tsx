import Link from "next/link";

export const CONTACT_EMAIL = "info@citizensoflightchurch.org";

/** Small footer at the end of every page: privacy notice and a way to reach the church. */
export function SiteFooter() {
  return (
    <footer className="mt-auto px-4 sm:px-6 md:px-12 pt-6 pb-28 md:pb-24 border-t border-white/5 text-xs text-white/60 flex flex-wrap items-center gap-x-5 gap-y-2">
      <span>© {new Date().getFullYear()} Muyiwa Areo Ministry International</span>
      <Link href="/privacy" className="hover:text-white underline-offset-4 hover:underline">
        Privacy
      </Link>
      <a href={`mailto:${CONTACT_EMAIL}`} className="hover:text-white underline-offset-4 hover:underline">
        Contact: {CONTACT_EMAIL}
      </a>
    </footer>
  );
}
