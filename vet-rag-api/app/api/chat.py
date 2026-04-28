from __future__ import annotations

import logging

from fastapi import APIRouter
from pydantic import BaseModel, Field

from app.agent.evaluator import evaluate_flags, log_interaction
from app.agent.formatter import FormattedResponse, format_response
from app.agent.interpreter import interpret_query
from app.agent.responder import generate_response
from app.agent.safety import normalize_species_label, urgency_message_for_triage
from app.agent.triage import classify_triage, generate_followup_questions

router = APIRouter(tags=["agent"])
logger = logging.getLogger(__name__)


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    species: str | None = Field(default=None, description='Retrieval filter: "dog" or "cat"; defaults to dog.')
    preference_hints: str | None = Field(
        default=None,
        max_length=6000,
        description="Optional user-specific steering from thumbs-down history (plain text).",
    )


@router.post("/chat", response_model=FormattedResponse)
def chat(req: ChatRequest) -> FormattedResponse:
    species = normalize_species_label(req.species)
    interpreted = interpret_query(req.message, species=species)
    triage = classify_triage(interpreted)
    followups = generate_followup_questions(interpreted)
    pet_word = "cat" if species == "cat" else "dog"

    try:
        raw = generate_response(
            req.message,
            triage,
            interpreted,
            preference_hints=req.preference_hints,
        )
        out = format_response(raw, triage, follow_up_questions=followups, species=species)
    except Exception:
        logger.exception("chat generation failed")

        out = FormattedResponse(
            triage_level=triage,  # type: ignore[arg-type]
            summary=(
                "Something went wrong generating a detailed answer. Please contact your veterinarian, "
                f"especially if your {pet_word} seems unwell."
            ),
            possible_causes=[],
            what_to_monitor=[],
            recommended_action=followups
            + ["Contact your veterinarian or an emergency clinic if you are worried."],
            urgency_message=urgency_message_for_triage(triage, species=species),
        )

    flags = evaluate_flags(req.message, triage, interpreted)
    try:
        log_interaction(user_input=req.message, triage_level=triage, response=out, flags=flags)
    except OSError:
        logger.warning("could not write eval log")

    return out
