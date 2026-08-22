import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { ShieldCheck, LogOut } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect('/login');
  }

  const userEmail = data.user.email || 'Admin';
  const initial = userEmail.charAt(0).toUpperCase();

  return (
    <div className="w-full flex flex-col min-h-full flex-1 text-white">
      {/* Sleek Glassmorphism Top Bar */}
      <header className="border-b border-white/10 bg-[#08090b]/80 backdrop-blur-xl py-3.5 px-6 md:px-8 flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 font-bold text-base md:text-lg text-white tracking-tight">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <span>Admin Center</span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            <ShieldCheck size={13} />
            Verified Admin
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
              {initial}
            </div>
            <span className="text-xs font-medium text-white/90 hidden sm:inline">{userEmail}</span>
          </div>

          <form action="/auth/signout" method="post">
            <button 
              type="submit"
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all flex items-center gap-1.5"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 w-full">
        {children}
      </main>
    </div>
  );
}
