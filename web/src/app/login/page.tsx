"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Lock, Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-100px)] flex-1 flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-[440px] bg-[#121316]/90 backdrop-blur-xl p-8 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden shrink-0">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 blur-[60px] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex justify-center mb-6 text-primary">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Lock size={22} />
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-center text-white mb-2 tracking-tight">Admin Portal</h1>
          <p className="text-center text-muted-foreground text-xs mb-8">
            Sign in to manage sermons and platform data.
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-white/80 mb-1.5 block uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-all"
                  placeholder="admin@citizens.church"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-white/80 mb-1.5 block uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" size={16} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-primary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-xs bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 shadow-md mt-2"
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
