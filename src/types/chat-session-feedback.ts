export type ChatSnapshotMessage = {
  id: string;
  role: string;
  content: string;
  created_at: string;
};

export type ChatSessionSnapshot = {
  messages: ChatSnapshotMessage[];
  pet_id: string | null;
  pet_name: string | null;
  pet_species: string | null;
  captured_at: string;
};

export type ChatSessionFeedbackRow = {
  id: string;
  thread_id: string;
  user_id: string;
  user_email: string | null;
  pet_id: string | null;
  comment: string;
  snapshot: ChatSessionSnapshot;
  created_at: string;
};
