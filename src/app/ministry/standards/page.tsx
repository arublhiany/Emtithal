import { redirect } from "next/navigation";

// The canonical government requirement-management surface is now
// /ministry/requirements (Phase 10). The old /ministry/standards route redirects
// so existing links keep working.
export default function StandardsRedirect() {
  redirect("/ministry/requirements");
}
