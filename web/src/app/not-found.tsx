import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="w-full min-h-[70vh] flex flex-col items-center justify-center text-center px-6 py-16 text-white relative z-10">
      <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 shadow-2xl">
        <span className="material-symbols-outlined text-[44px] text-[#888888]">
          explore_off
        </span>
      </div>

      <span className="text-xs font-bold uppercase tracking-widest text-[#AAAAAA] mb-2">
        404 • Page Not Found
      </span>

      <h1 className="font-heading text-2xl sm:text-4xl font-bold tracking-tight mb-3">
        Looking for a Message?
      </h1>

      <p className="text-sm sm:text-base text-[#AAAAAA] max-w-md mb-8 leading-relaxed">
        The page or sermon you are looking for does not exist or has been moved. Explore our catalog to find inspiration.
      </p>

      <div className="flex items-center gap-3.5 flex-wrap justify-center">
        <Link
          href="/"
          className="px-6 py-2.5 rounded-full bg-white text-black text-xs sm:text-sm font-bold hover:bg-white/90 active:scale-95 transition-all shadow-md flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">home</span>
          <span>Back to Home</span>
        </Link>

        <Link
          href="/search"
          className="px-6 py-2.5 rounded-full border border-white/20 text-white text-xs sm:text-sm font-medium hover:bg-white/10 active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">search</span>
          <span>Search Sermons</span>
        </Link>
      </div>
    </div>
  );
}
