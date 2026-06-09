from __future__ import annotations

import json
from typing import Any

from openai import OpenAI

from app.agent.rag_client import retrieve_context_deep
from app.agent.safety import (
    build_system_prompt,
    normalize_species_label,
    urgency_message_for_triage,
)
from app.agent.triage import assess_investigation, generate_followup_questions
from app.config import get_settings

_JSON_INSTRUCTION_BASE = """
INVESTIGATION_COMPLETE is true: you may give a full, grounded recommendation.

Return a single JSON object with exactly these keys:
- "triage_level": one of "emergency", "high", "moderate", "low" (must match the triage we provide)
- "summary": 1-2 short sentences max, conversational; lead with empathy then the key takeaway
- "possible_causes": array of short bullets (educational possibilities, not diagnoses). When RETRIEVED CONTEXT supports it, each bullet should pair a plausible cause with why it might fit this case (sign pattern, timing, species). Order most likely first; omit guesses the context does not support.
- "what_to_monitor": array of short bullets (specific signs that should prompt vet contact soon)
- "recommended_action": array of short bullets (safe, practical steps; vet visit when appropriate)
- "urgency_message": one short string; must align with triage (use the URGENCY_HINT we provide as a guide)

Use short bullets (one line each). No markdown. No medication dosages. Prefer 2-4 items per list unless emergency detail is essential.
"""

_JSON_HINT_SUFFIX = """
If PREFERENCE_HINTS is non-empty, it may include:
- VET TEACHING CORRECTIONS: trainer-reviewed scenarios marked INCORRECT/PARTIAL/CORRECT — apply the trainer notes for similar cases; do not repeat marked mistakes; reinforce marked-good patterns.
- Thumbs down / thumbs up: user vote patterns on past replies.
Avoid repeating mistakes from teaching corrections and downvotes; prefer reinforced patterns when they align with RETRIEVED_CONTEXT and safety. Safety and sources always override preference and teaching notes.
"""


def _json_instruction(*, include_feedback_hints: bool) -> str:
    return _JSON_INSTRUCTION_BASE + (_JSON_HINT_SUFFIX if include_feedback_hints else "")


_INVESTIGATION_MODE_SUFFIX = """

INVESTIGATION_MODE is active — act like a vet taking a history, not closing the case yet.
- OWNER_TURN_COUNT and MIN_TURNS_BEFORE_RECOMMENDATION show how early you are; do NOT jump to a diagnosis or full action plan until investigation is complete.
- CONVERSATION has prior turns: read them. Reflect back one specific detail they shared (shows you listened), then ask EXACTLY ONE new, granular question in "summary".
- Pick the question from MISSING_TOPICS / SUGGESTED_QUESTION_FOCUS if provided; otherwise choose the highest-yield gap (timing, progression, appetite, exposure, symptom-specific detail).
- Do NOT bundle multiple questions, numbered lists, or "also tell me about…" add-ons. One question mark seeking new info in the whole reply.
- Keep "possible_causes" empty (or at most one very broad, hedged phrase). No ranked differential lists yet.
- Keep "what_to_monitor" to 0-2 universal red-flag signs only if helpful; skip long lists.
- Keep "recommended_action" empty OR one brief safety line (e.g. when to call a vet) — no treatment plans, home remedies, or "try this" steps yet.
- Tone: curious, calm, human — short sentences, like texting. No formal disclaimers every turn.
- Still honor triage in urgency_message; for high urgency you may urge vet contact while still asking one focused question.
"""


def _context_block(chunks: list[dict[str, Any]], max_chars: int = 14000) -> str:
    lines: list[str] = []
    n = 0
    for i, c in enumerate(chunks, 1):
        meta = c.get("metadata") or {}
        src = meta.get("source_label") or c.get("source", "")
        piece = f"[{i}] (source: {src})\n{c.get('text', '')}\n"
        if n + len(piece) > max_chars:
            break
        lines.append(piece)
        n += len(piece)
    return "\n".join(lines) if lines else "(No retrieved context; answer conservatively and recommend vet for clinical concerns.)"


def generate_response(
    user_input: str,
    triage_level: str,
    interpreted_query: dict[str, Any],
    *,
    preference_hints: str | None = None,
    context: list[dict[str, Any]] | None = None,
    conversation_plain: str | None = None,
) -> str:
    """
    Call OpenAI with RAG context and safety-first system prompt.
    If ``context`` is None, retrieves via multi-query ``retrieve_context_deep(interpreted_query)``.
    Returns raw JSON string from the model.
    """
    settings = get_settings()
    if not settings.openai_api_key:
        raise ValueError("OPENAI_API_KEY is required for chat responses")

    sp = normalize_species_label(interpreted_query.get("species"))

    if context is None:
        context = retrieve_context_deep(interpreted_query, species=sp)

    client = OpenAI(api_key=settings.openai_api_key)
    system = build_system_prompt(triage_level, interpreted_query)
    urgency_hint = urgency_message_for_triage(triage_level, species=sp)
    hints = (preference_hints or "").strip()
    conv = (conversation_plain or "").strip()
    investigation = assess_investigation(
        interpreted_query,
        triage_level,
        conversation_plain=conv or None,
    )
    investigate = investigation.continue_investigation
    output_instructions = _json_instruction(include_feedback_hints=bool(hints))
    if investigate:
        output_instructions += _INVESTIGATION_MODE_SUFFIX

    suggested_q = generate_followup_questions(
        interpreted_query,
        missing_topics=investigation.missing_topics,
    )

    user_payload = {
        "user_message": user_input,
        "interpreted": interpreted_query,
        "triage_level": triage_level,
        "INVESTIGATION_MODE": investigate,
        "INVESTIGATION_COMPLETE": not investigate,
        "OWNER_TURN_COUNT": investigation.owner_turn_count,
        "MIN_TURNS_BEFORE_RECOMMENDATION": investigation.min_turns,
        "MISSING_TOPICS": investigation.missing_topics,
        "SUGGESTED_QUESTION_FOCUS": suggested_q[0] if suggested_q else None,
        "URGENCY_HINT": urgency_hint,
        "RETRIEVED_CONTEXT": _context_block(context) if not investigate else _context_block(context, max_chars=6000),
        "CONVERSATION": conv if conv else None,
        "PREFERENCE_HINTS": hints,
        "output_instructions": output_instructions,
    }

    resp = client.chat.completions.create(
        model=settings.openai_chat_model,
        temperature=0.42,
        response_format={"type": "json_object"},
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": json.dumps(user_payload, ensure_ascii=False)},
        ],
    )
    choice = resp.choices[0].message.content
    if not choice:
        return json.dumps(
            {
                "triage_level": triage_level,
                "summary": "I could not generate a full response. Please contact your veterinarian.",
                "possible_causes": [],
                "what_to_monitor": [],
                "recommended_action": ["Contact your veterinarian with this message."],
                "urgency_message": urgency_message_for_triage(triage_level, species=sp),
            }
        )
    return choice
