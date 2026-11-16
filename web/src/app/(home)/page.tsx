import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { HomeContent } from "@/components/home/HomeContent";
import { getRecentSermons } from "@/lib/sermon-server";

// The Featured and Recent shelves are rendered on the server with the 20 newest sermons,
// so their titles and links are in the HTML for search engines and slow phones. The admin
// routes refresh it when a sermon changes (lib/server/revalidate.ts); the hourly timer
// reshuffles Featured and is a safety net.
export const revalidate = 3600;

export default async function Homepage() {
  const initialRecent = await getRecentSermons();
  return (
    <Suspense
      fallback={
        <div className="h-[260px] flex items-center justify-center">
          <Loader2 className="animate-spin text-white/40" />
        </div>
      }
    >
      <HomeContent initialRecent={initialRecent} />
    </Suspense>
  );
}
