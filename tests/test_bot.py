"""
Unit tests for BotDen4ik data modules and utility functions.
Run with:  python -m pytest tests/
"""
from __future__ import annotations

import sys
import types


# ──────────────────────────────────────────────────────────────────────────────
# Stub telegram so tests work without installing the full library
# ──────────────────────────────────────────────────────────────────────────────

def _stub_telegram():
    """Create minimal telegram stubs so bot.py can be imported in tests."""

    class _Stub:
        def __init__(self, *args, **kwargs):
            pass

    telegram_stub = types.ModuleType("telegram")
    for name in ("InlineKeyboardButton", "InlineKeyboardMarkup", "Update"):
        setattr(telegram_stub, name, _Stub)
    constants_stub = types.ModuleType("telegram.constants")
    constants_stub.ParseMode = types.SimpleNamespace(HTML="HTML")
    telegram_stub.constants = constants_stub
    sys.modules.setdefault("telegram", telegram_stub)
    sys.modules.setdefault("telegram.constants", constants_stub)

    ext_stub = types.ModuleType("telegram.ext")
    for name in (
        "Application",
        "CallbackQueryHandler",
        "CommandHandler",
        "ContextTypes",
    ):
        setattr(ext_stub, name, _Stub)
    sys.modules.setdefault("telegram.ext", ext_stub)


_stub_telegram()


# ──────────────────────────────────────────────────────────────────────────────
# Data module tests
# ──────────────────────────────────────────────────────────────────────────────

from data.vocabulary import VOCABULARY
from data.phrases import COMPLAINTS, PATIENT_ANSWERS
from data.dialogues import QUESTIONS
from data.emergency import EMERGENCY
from data.quiz import QUIZ


class TestVocabulary:
    def test_has_categories(self):
        assert len(VOCABULARY) > 0

    def test_each_category_has_entries(self):
        for cat, entries in VOCABULARY.items():
            assert len(entries) > 0, f"Category '{cat}' is empty"

    def test_entries_have_required_keys(self):
        for cat, entries in VOCABULARY.items():
            for e in entries:
                assert "cs" in e, f"Missing 'cs' in {e}"
                assert "uk" in e, f"Missing 'uk' in {e}"

    def test_no_empty_strings(self):
        for cat, entries in VOCABULARY.items():
            for e in entries:
                assert e["cs"].strip(), f"Empty 'cs' in category {cat}"
                assert e["uk"].strip(), f"Empty 'uk' in category {cat}"


class TestPhrases:
    def test_complaints_not_empty(self):
        assert len(COMPLAINTS) > 0

    def test_complaints_have_keys(self):
        for c in COMPLAINTS:
            assert "cs" in c
            assert "uk" in c

    def test_patient_answers_structure(self):
        for qa in PATIENT_ANSWERS:
            assert "question_cs" in qa
            assert "question_uk" in qa
            assert "answers" in qa
            assert isinstance(qa["answers"], list)
            assert len(qa["answers"]) > 0


class TestDialogues:
    def test_has_stages(self):
        assert len(QUESTIONS) > 0

    def test_each_stage_has_entries(self):
        for stage, entries in QUESTIONS.items():
            assert len(entries) > 0, f"Stage '{stage}' is empty"

    def test_entries_have_both_languages(self):
        for stage, entries in QUESTIONS.items():
            for e in entries:
                assert "cs" in e
                assert "uk" in e


class TestEmergency:
    def test_not_empty(self):
        assert len(EMERGENCY) > 0

    def test_entries_have_keys(self):
        for e in EMERGENCY:
            assert "cs" in e
            assert "uk" in e


class TestQuiz:
    def test_not_empty(self):
        assert len(QUIZ) > 0

    def test_entries_structure(self):
        for q in QUIZ:
            assert "question" in q
            assert "options" in q
            assert "answer" in q
            assert "explanation" in q

    def test_answer_index_in_range(self):
        for q in QUIZ:
            assert 0 <= q["answer"] < len(q["options"]), (
                f"Answer index {q['answer']} out of range for '{q['question']}'"
            )

    def test_options_are_non_empty_strings(self):
        for q in QUIZ:
            for opt in q["options"]:
                assert isinstance(opt, str) and opt.strip()


# ──────────────────────────────────────────────────────────────────────────────
# Utility function tests (imported from bot module)
# ──────────────────────────────────────────────────────────────────────────────

from bot import _split_text, fmt_vocab_entry, fmt_phrase


class TestSplitText:
    def test_short_text_unchanged(self):
        text = "hello"
        assert _split_text(text, 100) == ["hello"]

    def test_splits_at_newline(self):
        text = "a\nb\nc"
        result = _split_text(text, 3)
        assert len(result) > 1
        for chunk in result:
            assert len(chunk) <= 3

    def test_no_chunk_exceeds_limit(self):
        long_text = "\n".join(["word"] * 200)
        for chunk in _split_text(long_text, 50):
            assert len(chunk) <= 50

    def test_rejoined_equals_original(self):
        original = "\n".join(f"line {i}" for i in range(100))
        chunks = _split_text(original, 50)
        rejoined = "\n".join(chunks)
        assert rejoined == original


class TestFormatters:
    def test_fmt_vocab_entry_basic(self):
        entry = {"cs": "zub", "uk": "зуб"}
        result = fmt_vocab_entry(entry)
        assert "zub" in result
        assert "зуб" in result

    def test_fmt_vocab_entry_with_note(self):
        entry = {"cs": "zub", "uk": "зуб", "note": "basic term"}
        result = fmt_vocab_entry(entry)
        assert "basic term" in result

    def test_fmt_phrase_with_phonetic(self):
        entry = {"cs": "Bolí mě zub.", "uk": "Болить зуб.", "ph": "Болі мє зуб."}
        result = fmt_phrase(entry)
        assert "Болі мє зуб." in result

    def test_fmt_phrase_without_phonetic(self):
        entry = {"cs": "Bolí mě zub.", "uk": "Болить зуб."}
        result = fmt_phrase(entry)
        assert "Болить зуб." in result
