import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/components/layout/SiteFooter";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Messages handles information when you listen to and search sermons.",
};

const LAST_UPDATED = "3 October 2026";

// Describes what the code actually does. Update it whenever data handling changes
// (new analytics, accounts for visitors, new third-party services, etc.).
export default function PrivacyPage() {
  return (
    <article className="w-full max-w-3xl px-4 sm:px-6 md:px-12 py-8 sm:py-12 text-white/80 text-sm leading-relaxed flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">Privacy</h1>
        <p className="text-white/60 text-xs">Last updated {LAST_UPDATED}</p>
        <p>
          Messages is the sermon library of Muyiwa Areo Ministry International. You can listen, search and save
          sermons without creating an account. This page explains the little information involved and who handles it.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-white">What stays on your device</h2>
        <p>
          Your favourites, where you stopped in each sermon, and your volume setting are saved only in your browser
          (local storage). We never receive them. Clearing your browser data removes them.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-white">Ask AI</h2>
        <p>
          When you use Ask AI, the question you type is sent to our AI provider, Groq (United States), to understand
          it and write a short answer from our sermon summaries. We do not save your questions. Please don&apos;t type
          personal or sensitive details into the question box.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-white">Listening statistics and visit counts</h2>
        <p>
          We count how many times each sermon is played or downloaded, as anonymous totals (at most once per sermon
          per browser session). We use Vercel Web Analytics to count page visits. It does not use cookies and does not
          identify you.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-white">Error reports</h2>
        <p>
          If something breaks, the site may record a technical error report (the page address, the error message and
          your browser type) so we can fix it. Reports do not include your name, email or what you were listening to,
          and are deleted after 90 days.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-white">Services that host the site</h2>
        <ul className="list-disc pl-5 flex flex-col gap-1">
          <li>Vercel (website hosting) and Supabase (sermon database) process standard technical data such as IP addresses to deliver the site and keep it secure.</li>
          <li>Sermon audio is streamed from the Internet Archive (archive.org), which receives your request when you press play or download.</li>
          <li>Icons are loaded from Google Fonts.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-white">Staff accounts</h2>
        <p>Only ministry staff who manage the library have accounts. Their email addresses are stored securely with Supabase.</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-heading text-lg font-bold text-white">Your rights and contact</h2>
        <p>
          Under the Nigeria Data Protection Act 2023 and, where it applies, the UK and EU GDPR, you can ask what
          information we hold about you, and ask us to correct or delete it. Email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-blue-400 underline underline-offset-4">{CONTACT_EMAIL}</a>.
        </p>
      </section>
    </article>
  );
}
