import { redirect } from "next/navigation";
import { isDevFeedbackEnabled } from "@/lib/dev-access";
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
    .select("id, name, breed, age_years, photo_url, species")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return (
    <ConsultChat
      pets={pets ?? []}
      initialThreadId={null}
      initialMessages={[]}
      showDevTab={isDevFeedbackEnabled()}
    />
  );
}
