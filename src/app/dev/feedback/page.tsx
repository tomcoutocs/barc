import { notFound, redirect } from "next/navigation";
import { isDevFeedbackViewer } from "@/lib/dev-access";
import { createClient } from "@/lib/supabase/server";
import { DevFeedbackViewer } from "./dev-feedback-viewer";

export default async function DevFeedbackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dev/feedback");
  }

  if (!isDevFeedbackViewer(user.email)) {
    notFound();
  }

  return <DevFeedbackViewer />;
}
