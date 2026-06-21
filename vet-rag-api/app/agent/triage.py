from __future__ import annotations

import re
from typing import Any

TriageLevel = str  # "emergency" | "high" | "moderate" | "low"

_EMERGENCY = re.compile(
    r"\b(seizure|collapse|collapsed|bloat|gdv|chocolate|xylitol|antifreeze|ethylene\s+glycol|"
    r"poison(?:ed)?|toxin|can'?t\s+breathe|gasping|cyanosis|blue\s+gums|"
    r"distended\s+abdomen|acute\s+abdomen)\b",
    re.I,
)

_GENERAL_INFO = re.compile(
    r"\b(how\s+often|what\s+is|when\s+should|best\s+food|vaccine|training|groom|normal\s+for)\b",
    re.I,
)


def _hours_from_duration(duration: str | None) -> float | None:
    if not duration:
        return None
    d = duration.lower()
    m = re.search(r"(\d+)\s*hours?", d)
    if m:
        return float(m.group(1))
    m = re.search(r"(\d+)\s*days?", d)
    if m:
        return float(m.group(1)) * 24.0
    m = re.search(r"(\d+)\s*weeks?", d)
    if m:
        return float(m.group(1)) * 24.0 * 7
    if "same_day" in d or "~1 day" in d:
        return 12.0
    return None


def classify_triage(interpreted_query: dict[str, Any]) -> TriageLevel:
    text = interpreted_query.get("normalized_query", "") or ""
    symptoms: list[str] = list(interpreted_query.get("symptoms") or [])
    toxins: list[str] = list(interpreted_query.get("suspected_toxins") or [])
    sev: list[str] = list(interpreted_query.get("severity_flags") or [])
    duration = interpreted_query.get("duration")

    if toxins or _EMERGENCY.search(text):
        return "emergency"
    if "seizure" in symptoms or "collapse" in symptoms or "bloat" in symptoms:
        return "emergency"
    if "difficulty_breathing" in symptoms:
        return "emergency"
    if any(s in sev for s in ("collapsed", "cyanosis", "severe_respiratory_distress", "unresponsive")):
        return "emergency"

    hrs = _hours_from_duration(duration)
    if hrs is not None and hrs >= 48 and symptoms:
        return "high"
    if len(symptoms) >= 2:
        return "high"
    if "anorexia" in symptoms and ("vomiting" in symptoms or hrs is not None and hrs >= 24):
        return "high"
    if "vomiting" in symptoms and hrs is not None and hrs >= 48:
        return "high"

    if symptoms and _GENERAL_INFO.search(text):
        return "moderate"

    if symptoms:
        return "moderate"

    if _GENERAL_INFO.search(text) or not symptoms:
        return "low"

    return "moderate"


class InvestigationState:
    """Whether to keep interviewing vs deliver a full recommendation."""

    __slots__ = ("continue_investigation", "owner_turn_count", "missing_topics", "min_turns")

    def __init__(
        self,
        continue_investigation: bool,
        *,
        owner_turn_count: int = 1,
        missing_topics: list[str] | None = None,
        min_turns: int = 4,
    ) -> None:
        self.continue_investigation = continue_investigation
        self.owner_turn_count = owner_turn_count
        self.missing_topics = missing_topics or []
        self.min_turns = min_turns


_TOPIC_PATTERNS: list[tuple[str, re.Pattern[str]]] = [
    ("duration", re.compile(r"\b(\d+\s*(?:hour|hr|day|week|min)|since|started|began|yesterday|today|this\s+morning|ago|how\s+long)\b", re.I)),
    ("progression", re.compile(r"\b(worse|better|same|improv|declin|constant|on\s+and\s+off|intermittent|episod|steady|getting)\b", re.I)),
    ("appetite_water", re.compile(r"\b(eat|eating|food|appetite|drink|water|thirst|hungry|nausea|not\s+eating|won'?t\s+eat)\b", re.I)),
    ("demeanor", re.compile(r"\b(letharg|energy|tired|weak|pain|whimper|cry|hiding|restless|anxious|normal\s+self|acting)\b", re.I)),
    ("age_weight", re.compile(r"\b(\d+\s*(?:lb|lbs|kg|pound|year|yr|month|mo|week)|puppy|kitten|senior|adult|weigh|weight)\b", re.I)),
    ("exposure", re.compile(r"\b(ate|eaten|ingest|toxin|plant|medication|pill|chemical|garbage|counter|diet\s+change|new\s+food)\b", re.I)),
    ("vomit_detail", re.compile(r"\b(vomit|throw\s+up|regurgit).{0,40}\b(blood|bile|foam|yellow|clear|frequency|times|per\s+day|projectile|hairball)\b|\b(how\s+often).{0,30}\b(vomit|throw)", re.I)),
    ("stool_detail", re.compile(r"\b(stool|poop|diarrh|loose).{0,40}\b(blood|mucus|watery|frequency|accident|strain)\b|\b(how\s+often).{0,30}\b(poop|stool|diarrh)", re.I)),
    ("urination", re.compile(r"\b(pee|urinat|potty|straining|accident|blood).{0,30}\b(urin|pee)|\burinat", re.I)),
    ("breathing_detail", re.compile(r"\b(pant|breath|cough|wheeze|gasp|open.mouth|effort)\b", re.I)),
    ("skin_itch", re.compile(r"\b(itch|scratch|rash|hot\s+spot|lick|chew|hair\s+loss|bump|lump)\b", re.I)),
    ("neuro", re.compile(r"\b(seizure|tremor|wobbly|ataxia|head\s+tilt|circle|disorient|stagger)\b", re.I)),
]


def _owner_turn_count(conversation_plain: str | None) -> int:
    if not conversation_plain:
        return 0
    return len(re.findall(r"^Owner:\s*", conversation_plain, re.M))


def _owner_text_blob(interpreted_query: dict[str, Any], conversation_plain: str | None) -> str:
    parts: list[str] = []
    if conversation_plain:
        for line in conversation_plain.splitlines():
            if line.startswith("Owner:"):
                parts.append(line[6:].strip())
    latest = (interpreted_query.get("user_text") or "").strip()
    if latest:
        parts.append(latest)
    return "\n".join(parts).lower()


def _topics_covered(text: str) -> set[str]:
    covered: set[str] = set()
    for name, pat in _TOPIC_PATTERNS:
        if pat.search(text):
            covered.add(name)
    return covered


def _required_topics(symptoms: list[str], *, has_toxins: bool) -> set[str]:
    req = {"duration", "progression", "appetite_water", "demeanor", "age_weight"}
    if not has_toxins:
        req.add("exposure")
    if "vomiting" in symptoms:
        req.add("vomit_detail")
    if "diarrhea" in symptoms:
        req.add("stool_detail")
    if "difficulty_breathing" in symptoms or "panting" in symptoms:
        req.add("breathing_detail")
    if "itching" in symptoms or "scratching" in symptoms:
        req.add("skin_itch")
    if "seizure" in symptoms or "collapse" in symptoms or "unable_to_stand" in symptoms:
        req.add("neuro")
    if "anorexia" in symptoms:
        req.add("appetite_water")
    return req


def _min_owner_turns(triage_level: str, *, has_symptoms: bool) -> int:
    t = triage_level.lower()
    if t == "emergency":
        return 0
    if t == "high":
        return 2
    if t == "moderate" and has_symptoms:
        return 3
    if t == "low" and has_symptoms:
        return 2
    return 2


def assess_investigation(
    interpreted_query: dict[str, Any],
    triage_level: str,
    *,
    conversation_plain: str | None = None,
) -> InvestigationState:
    """
    Vet-style interview: stay in question mode until enough owner turns and topics
    are covered, then allow a full recommendation.
    """
    symptoms: list[str] = list(interpreted_query.get("symptoms") or [])
    toxins: list[str] = list(interpreted_query.get("suspected_toxins") or [])
    combined = _owner_text_blob(interpreted_query, conversation_plain)
    owner_turns = _owner_turn_count(conversation_plain) + 1

    if not combined.strip():
        return InvestigationState(True, owner_turn_count=owner_turns, missing_topics=["symptoms"])

    if _GENERAL_INFO.search(combined) and not symptoms:
        return InvestigationState(False, owner_turn_count=owner_turns)

    if triage_level == "emergency" or toxins:
        return InvestigationState(False, owner_turn_count=owner_turns)

    if not symptoms:
        return InvestigationState(
            True,
            owner_turn_count=owner_turns,
            missing_topics=["symptoms"],
            min_turns=3,
        )

    covered = _topics_covered(combined)
    if interpreted_query.get("duration"):
        covered.add("duration")

    required = _required_topics(symptoms, has_toxins=bool(toxins))
    missing = [t for t in sorted(required) if t not in covered]
    min_turns = _min_owner_turns(triage_level, has_symptoms=True)

    if owner_turns < min_turns and len(missing) >= 3:
        return InvestigationState(
            True,
            owner_turn_count=owner_turns,
            missing_topics=missing,
            min_turns=min_turns,
        )

    if len(missing) >= 3:
        return InvestigationState(
            True,
            owner_turn_count=owner_turns,
            missing_topics=missing,
            min_turns=min_turns,
        )

    # Enough context to give useful guidance — don't drag the interview.
    if owner_turns >= min_turns and len(missing) <= 2:
        return InvestigationState(False, owner_turn_count=owner_turns, missing_topics=missing)

    if missing and owner_turns < min_turns:
        return InvestigationState(
            True,
            owner_turn_count=owner_turns,
            missing_topics=missing,
            min_turns=min_turns,
        )

    return InvestigationState(False, owner_turn_count=owner_turns, missing_topics=missing)


def should_clarify_before_detail(
    interpreted_query: dict[str, Any],
    triage_level: str,
    *,
    conversation_plain: str | None = None,
) -> bool:
    return assess_investigation(
        interpreted_query,
        triage_level,
        conversation_plain=conversation_plain,
    ).continue_investigation


_QUESTION_BY_TOPIC: dict[str, str] = {
    "duration": "When did this start — and has it been steady or on-and-off?",
    "progression": "Compared to day one, would you say it's getting worse, about the same, or easing up?",
    "appetite_water": "How are eating and drinking — normal, off, or refusing both?",
    "demeanor": "Energy-wise, are they acting like themselves or quieter / uncomfortable?",
    "age_weight": "How old are they, roughly, and about how much do they weigh?",
    "exposure": "Any chance they got into something odd — table scraps, plants, meds, or a new food?",
    "vomit_detail": "On the vomiting — how often, and any blood, bile, or foam?",
    "stool_detail": "And the stool — how often, and watery, bloody, or with mucus?",
    "urination": "How's peeing been — normal, straining, accidents, or blood?",
    "breathing_detail": "Tell me about the breathing — coughing, panting at rest, or working hard?",
    "skin_itch": "Where are they itchy or licking most — any rash, bumps, or hair loss?",
    "neuro": "Any wobbliness, head tilt, circling, or has this happened before?",
    "symptoms": "What's the main thing you're seeing right now — anything else with it?",
}


def generate_followup_questions(
    interpreted_query: dict[str, Any],
    *,
    missing_topics: list[str] | None = None,
) -> list[str]:
    """One granular, symptom-aware question targeting the biggest gap."""
    pet = "cat" if interpreted_query.get("species") == "cat" else "dog"
    young = "kitten" if pet == "cat" else "puppy"
    qs: list[str] = []

    for topic in missing_topics or []:
        if topic in _QUESTION_BY_TOPIC:
            qs.append(_QUESTION_BY_TOPIC[topic])
            return qs[:1]

    if interpreted_query.get("duration") is None and interpreted_query.get("symptoms"):
        qs.append(_QUESTION_BY_TOPIC["duration"])
    elif "progression" not in _topics_covered(
        (interpreted_query.get("normalized_query") or "").lower(),
    ):
        qs.append(_QUESTION_BY_TOPIC["progression"])
    elif interpreted_query.get("symptoms") and "weight" not in " ".join(
        interpreted_query.get("normalized_query", "").lower(),
    ):
        qs.append(f"About how old is your {pet} ({young}, adult, senior), and roughly how much do they weigh?")
    elif not interpreted_query.get("suspected_toxins") and interpreted_query.get("symptoms"):
        qs.append(_QUESTION_BY_TOPIC["exposure"])
    else:
        qs.append(
            f"Anything else you've noticed — even small changes in behavior, bathroom habits, or appetite?",
        )
    return qs[:1]
