import type { User } from '@supabase/supabase-js'

/**
 * True only for accounts flagged as admins of THIS app.
 *
 * The Supabase project is shared with other apps that allow public sign-up,
 * so "logged in" must never mean "admin". The flag lives in app_metadata,
 * which users cannot edit themselves (unlike user_metadata), and is named
 * per app so it can't clash with other projects' roles.
 * The database RLS policies check the same claim.
 */
export function isMessagesAdmin(user: User | null | undefined): boolean {
  return user?.app_metadata?.messages_admin === true
}
