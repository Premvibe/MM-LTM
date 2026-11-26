import { useEffect } from "react";

/**
 * Keeps an admin or manager signed in when the High Touch / Mid Touch switch moves them between
 * the main website and the Mid touch website. The two are separate websites, so the browser keeps
 * their saved logins apart. The switch passes the login in the link's "#" part, which is never
 * sent to a server. This page saves it, removes it from the address bar and opens the dashboard.
 * Both backends share JWT_SECRET, so the same token works on either.
 */
const ADMIN_ROLES = ["admin", "program_director", "program_lead", "program_manager", "m_e_manager"];

export const HANDOFF_PATH = "/handoff";

/** Link to the other website that carries this login with it */
export function handoffUrl(siteUrl: string, user: unknown) {
  const payload = btoa(unescape(encodeURIComponent(JSON.stringify(user))));
  return `${siteUrl}${HANDOFF_PATH}#u=${encodeURIComponent(payload)}`;
}

export default function LoginHandoff({ storageKey, allowMidOnly }: { storageKey: string; allowMidOnly: boolean }) {
  useEffect(() => {
    let signedIn = false;
    try {
      const raw = new URLSearchParams(window.location.hash.slice(1)).get("u");
      if (raw) {
        const user = JSON.parse(decodeURIComponent(escape(atob(raw))));
        const allowed = user?.token && ADMIN_ROLES.includes(user.role) && (allowMidOnly || user.programModel !== "mid");
        if (allowed) {
          localStorage.setItem(storageKey, JSON.stringify(user));
          signedIn = true;
        }
      }
    } catch {
      // Damaged link: fall back to the sign-in page
    }
    window.history.replaceState(null, "", window.location.pathname);
    // Full page load, so the app starts up with the saved login
    window.location.replace(signedIn ? "/dashboard" : "/login");
  }, [storageKey, allowMidOnly]);
  return null;
}
