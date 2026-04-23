export type ConsultAgentResponse = {
  triage_level: "emergency" | "high" | "moderate" | "low";
  summary: string;
  possible_causes: string[];
  what_to_monitor: string[];
  recommended_action: string[];
  urgency_message: string;
};

export const BARC_JSON_MARKER = "\n__BARC_JSON__\n";

export function formatAgentForStorage(agent: ConsultAgentResponse): string {
  const lines: string[] = [
    `**${agent.triage_level.toUpperCase()}** · ${agent.urgency_message}`,
    "",
    agent.summary,
  ];
  if (agent.possible_causes.length) {
    lines.push("", "Possible causes (educational only, not a diagnosis):");
    for (const c of agent.possible_causes) lines.push(`• ${c}`);
  }
  if (agent.what_to_monitor.length) {
    lines.push("", "What to watch for:");
    for (const c of agent.what_to_monitor) lines.push(`• ${c}`);
  }
  if (agent.recommended_action.length) {
    lines.push("", "Recommended actions:");
    for (const c of agent.recommended_action) lines.push(`• ${c}`);
  }
  const readable = lines.join("\n");
  return `${readable}${BARC_JSON_MARKER}${JSON.stringify(agent)}`;
}

export function parseStoredAgentContent(raw: string): {
  structured: ConsultAgentResponse | null;
  fallbackText: string;
} {
  const idx = raw.lastIndexOf(BARC_JSON_MARKER);
  if (idx === -1) {
    return { structured: null, fallbackText: raw };
  }
  const head = raw.slice(0, idx).trimEnd();
  const jsonPart = raw.slice(idx + BARC_JSON_MARKER.length).trim();
  try {
    const parsed = JSON.parse(jsonPart) as ConsultAgentResponse;
    if (
      parsed &&
      typeof parsed.summary === "string" &&
      typeof parsed.triage_level === "string"
    ) {
      return { structured: parsed, fallbackText: head };
    }
  } catch {
    /* ignore */
  }
  return { structured: null, fallbackText: raw };
}
