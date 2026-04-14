import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ConsultChat } from "./consult-chat";

export default async function ConsultPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/consult");
  }

  const { data: pets } = await supabase
    .from("pets")
    .select("id, name, breed, age_years, photo_url")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { data: thread } = await supabase
    .from("chat_threads")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let initialMessages: {
    id: string;
    role: string;
    content: string;
    created_at: string;
  }[] = [];

  if (thread) {
    const { data: msgs } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("thread_id", thread.id)
      .order("created_at", { ascending: true });
    initialMessages = msgs ?? [];
  }

  return (
    <ConsultChat
      pets={pets ?? []}
      initialThreadId={thread?.id ?? null}
      initialMessages={initialMessages}
    />
  );
}
