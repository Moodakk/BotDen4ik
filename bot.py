"""
BotDen4ik — Telegram-бот для підготовки українського стоматолога до прийому чеських пацієнтів.

Запуск:
    TELEGRAM_TOKEN=<your_token> python bot.py
"""

from __future__ import annotations

import logging
import os
import random
from functools import wraps

from telegram import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Update,
)
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CallbackQueryHandler,
    CommandHandler,
    ContextTypes,
)

from data.dialogues import QUESTIONS
from data.emergency import EMERGENCY
from data.phrases import COMPLAINTS, PATIENT_ANSWERS
from data.quiz import QUIZ
from data.vocabulary import VOCABULARY

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)

# ──────────────────────────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────────────────────────

BACK_BUTTON = InlineKeyboardButton("⬅️ Назад", callback_data="main_menu")


def main_menu_keyboard() -> InlineKeyboardMarkup:
    keyboard = [
        [InlineKeyboardButton("🦷 Словник термінів", callback_data="vocab_menu")],
        [InlineKeyboardButton("🗣 Скарги пацієнтів", callback_data="complaints")],
        [InlineKeyboardButton("💬 Діалог на прийомі", callback_data="dialogues_menu")],
        [InlineKeyboardButton("🚨 Невідкладні фрази", callback_data="emergency")],
        [InlineKeyboardButton("🧠 Вікторина", callback_data="quiz_start")],
        [InlineKeyboardButton("ℹ️ Довідка", callback_data="help")],
    ]
    return InlineKeyboardMarkup(keyboard)


def back_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup([[BACK_BUTTON]])


def vocab_menu_keyboard() -> InlineKeyboardMarkup:
    buttons = []
    for idx, category in enumerate(VOCABULARY):
        buttons.append([InlineKeyboardButton(category, callback_data=f"vocab_{idx}")])
    buttons.append([BACK_BUTTON])
    return InlineKeyboardMarkup(buttons)


def dialogues_menu_keyboard() -> InlineKeyboardMarkup:
    buttons = []
    for idx, category in enumerate(QUESTIONS):
        buttons.append([InlineKeyboardButton(category, callback_data=f"dial_{idx}")])
    buttons.append([BACK_BUTTON])
    return InlineKeyboardMarkup(buttons)


def fmt_vocab_entry(entry: dict) -> str:
    line = f"🇨🇿 <b>{entry['cs']}</b>\n🇺🇦 {entry['uk']}"
    if entry.get("note"):
        line += f"\n<i>({entry['note']})</i>"
    return line


def fmt_phrase(entry: dict) -> str:
    text = f"🇨🇿 <b>{entry['cs']}</b>\n🇺🇦 {entry['uk']}"
    if entry.get("ph"):
        text += f"\n🔉 <i>{entry['ph']}</i>"
    return text


def safe_handler(func):
    """Decorator to log exceptions without crashing the bot."""

    @wraps(func)
    async def wrapper(update: Update, context: ContextTypes.DEFAULT_TYPE):
        try:
            return await func(update, context)
        except Exception:
            logger.exception("Unhandled error in %s", func.__name__)

    return wrapper


# ──────────────────────────────────────────────────────────────────────────────
# Command handlers
# ──────────────────────────────────────────────────────────────────────────────

@safe_handler
async def start(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (
        "👋 <b>Вітаємо у BotDen4ik!</b>\n\n"
        "Цей бот допоможе українському стоматологу підготуватися до прийому "
        "<b>чеськомовних пацієнтів</b>.\n\n"
        "Оберіть розділ:"
    )
    if update.message:
        await update.message.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=main_menu_keyboard())
    elif update.callback_query:
        await update.callback_query.edit_message_text(text, parse_mode=ParseMode.HTML, reply_markup=main_menu_keyboard())


@safe_handler
async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    text = (
        "ℹ️ <b>Довідка BotDen4ik</b>\n\n"
        "🦷 <b>Словник термінів</b> — чесько-українські стоматологічні терміни за категоріями.\n"
        "🗣 <b>Скарги пацієнтів</b> — типові фрази, якими пацієнт описує біль і симптоми.\n"
        "💬 <b>Діалог на прийомі</b> — питання до пацієнта від анамнезу до рекомендацій.\n"
        "🚨 <b>Невідкладні фрази</b> — що робити й говорити у разі ускладнень.\n"
        "🧠 <b>Вікторина</b> — перевірте свої знання!\n\n"
        "Команди:\n/start — головне меню\n/help — ця довідка"
    )
    if update.message:
        await update.message.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=back_keyboard())
    elif update.callback_query:
        await update.callback_query.edit_message_text(text, parse_mode=ParseMode.HTML, reply_markup=back_keyboard())


# ──────────────────────────────────────────────────────────────────────────────
# Callback query handler
# ──────────────────────────────────────────────────────────────────────────────

@safe_handler
async def button(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    query = update.callback_query
    await query.answer()
    data = query.data

    # ── Main menu ──────────────────────────────────────────────────────────────
    if data == "main_menu":
        await start(update, context)
        return

    if data == "help":
        await help_command(update, context)
        return

    # ── Vocabulary ─────────────────────────────────────────────────────────────
    if data == "vocab_menu":
        await query.edit_message_text(
            "🦷 <b>Словник стоматологічних термінів</b>\nОберіть категорію:",
            parse_mode=ParseMode.HTML,
            reply_markup=vocab_menu_keyboard(),
        )
        return

    if data.startswith("vocab_"):
        idx = int(data.split("_")[1])
        categories = list(VOCABULARY.keys())
        if idx >= len(categories):
            return
        category = categories[idx]
        entries = VOCABULARY[category]
        lines = [f"<b>{category}</b>\n"]
        lines += [fmt_vocab_entry(e) for e in entries]
        text = "\n\n".join(lines)
        # Telegram message limit is 4096 chars; split if necessary.
        chunks = _split_text(text, 4000)
        for i, chunk in enumerate(chunks):
            kb = back_keyboard() if i == len(chunks) - 1 else None
            if i == 0:
                await query.edit_message_text(chunk, parse_mode=ParseMode.HTML, reply_markup=kb)
            else:
                await query.message.reply_text(chunk, parse_mode=ParseMode.HTML, reply_markup=kb)
        return

    # ── Complaints ─────────────────────────────────────────────────────────────
    if data == "complaints":
        lines = ["🗣 <b>Типові скарги пацієнтів</b>\n"]
        lines += [fmt_phrase(c) for c in COMPLAINTS]
        text = "\n\n".join(lines)
        chunks = _split_text(text, 4000)
        for i, chunk in enumerate(chunks):
            kb = back_keyboard() if i == len(chunks) - 1 else None
            if i == 0:
                await query.edit_message_text(chunk, parse_mode=ParseMode.HTML, reply_markup=kb)
            else:
                await query.message.reply_text(chunk, parse_mode=ParseMode.HTML, reply_markup=kb)
        return

    # ── Dialogues ──────────────────────────────────────────────────────────────
    if data == "dialogues_menu":
        await query.edit_message_text(
            "💬 <b>Діалог на прийомі</b>\nОберіть етап:",
            parse_mode=ParseMode.HTML,
            reply_markup=dialogues_menu_keyboard(),
        )
        return

    if data.startswith("dial_"):
        idx = int(data.split("_")[1])
        categories = list(QUESTIONS.keys())
        if idx >= len(categories):
            return
        category = categories[idx]
        entries = QUESTIONS[category]
        lines = [f"<b>{category}</b>\n"]
        for e in entries:
            lines.append(f"🇨🇿 <b>{e['cs']}</b>\n🇺🇦 {e['uk']}")
        text = "\n\n".join(lines)
        chunks = _split_text(text, 4000)
        for i, chunk in enumerate(chunks):
            kb = InlineKeyboardMarkup([[InlineKeyboardButton("⬅️ Назад", callback_data="dialogues_menu")]]) \
                if i == len(chunks) - 1 else None
            if i == 0:
                await query.edit_message_text(chunk, parse_mode=ParseMode.HTML, reply_markup=kb)
            else:
                await query.message.reply_text(chunk, parse_mode=ParseMode.HTML, reply_markup=kb)
        return

    # ── Emergency ──────────────────────────────────────────────────────────────
    if data == "emergency":
        lines = ["🚨 <b>Невідкладні фрази</b>\n"]
        lines += [fmt_phrase(e) for e in EMERGENCY]
        text = "\n\n".join(lines)
        chunks = _split_text(text, 4000)
        for i, chunk in enumerate(chunks):
            kb = back_keyboard() if i == len(chunks) - 1 else None
            if i == 0:
                await query.edit_message_text(chunk, parse_mode=ParseMode.HTML, reply_markup=kb)
            else:
                await query.message.reply_text(chunk, parse_mode=ParseMode.HTML, reply_markup=kb)
        return

    # ── Quiz ───────────────────────────────────────────────────────────────────
    if data == "quiz_start":
        context.user_data["quiz_indices"] = random.sample(range(len(QUIZ)), min(len(QUIZ), 5))
        context.user_data["quiz_step"] = 0
        context.user_data["quiz_score"] = 0
        await _send_quiz_question(query, context)
        return

    if data.startswith("quiz_ans_"):
        parts = data.split("_")
        chosen = int(parts[2])
        step = context.user_data.get("quiz_step", 0)
        indices = context.user_data.get("quiz_indices", [])
        if step >= len(indices):
            return
        q = QUIZ[indices[step]]
        correct = q["answer"]
        score = context.user_data.get("quiz_score", 0)
        if chosen == correct:
            score += 1
            result_text = "✅ <b>Правильно!</b>"
        else:
            result_text = f"❌ <b>Неправильно.</b>\nПравильна відповідь: <b>{q['options'][correct]}</b>"
        result_text += f"\n<i>{q['explanation']}</i>"
        context.user_data["quiz_score"] = score
        context.user_data["quiz_step"] = step + 1

        next_step = step + 1
        if next_step < len(indices):
            keyboard = InlineKeyboardMarkup(
                [[InlineKeyboardButton("➡️ Наступне питання", callback_data="quiz_next")]]
            )
        else:
            keyboard = InlineKeyboardMarkup(
                [
                    [InlineKeyboardButton("🔄 Спробувати знову", callback_data="quiz_start")],
                    [BACK_BUTTON],
                ]
            )
        await query.edit_message_text(result_text, parse_mode=ParseMode.HTML, reply_markup=keyboard)
        return

    if data == "quiz_next":
        await _send_quiz_question(query, context)
        return


# ──────────────────────────────────────────────────────────────────────────────
# Quiz helpers
# ──────────────────────────────────────────────────────────────────────────────

async def _send_quiz_question(query, context: ContextTypes.DEFAULT_TYPE) -> None:
    step = context.user_data.get("quiz_step", 0)
    indices = context.user_data.get("quiz_indices", [])
    if step >= len(indices):
        score = context.user_data.get("quiz_score", 0)
        total = len(indices)
        text = (
            f"🏁 <b>Вікторину завершено!</b>\n\n"
            f"Ваш результат: <b>{score}/{total}</b>\n\n"
            + ("🎉 Чудово!" if score == total else "💪 Продовжуйте навчатись!")
        )
        keyboard = InlineKeyboardMarkup(
            [
                [InlineKeyboardButton("🔄 Спробувати знову", callback_data="quiz_start")],
                [BACK_BUTTON],
            ]
        )
        await query.edit_message_text(text, parse_mode=ParseMode.HTML, reply_markup=keyboard)
        return

    q = QUIZ[indices[step]]
    total = len(indices)
    text = f"🧠 <b>Вікторина ({step + 1}/{total})</b>\n\n{q['question']}"
    buttons = [
        [InlineKeyboardButton(opt, callback_data=f"quiz_ans_{i}")]
        for i, opt in enumerate(q["options"])
    ]
    buttons.append([BACK_BUTTON])
    await query.edit_message_text(
        text, parse_mode=ParseMode.HTML, reply_markup=InlineKeyboardMarkup(buttons)
    )


# ──────────────────────────────────────────────────────────────────────────────
# Utility
# ──────────────────────────────────────────────────────────────────────────────

def _split_text(text: str, limit: int = 4000) -> list[str]:
    """Split text into chunks no longer than *limit* characters, breaking at newlines."""
    if len(text) <= limit:
        return [text]
    chunks: list[str] = []
    while text:
        if len(text) <= limit:
            chunks.append(text)
            break
        split_at = text.rfind("\n", 0, limit)
        if split_at == -1:
            split_at = limit
        chunks.append(text[:split_at])
        text = text[split_at:].lstrip("\n")
    return chunks


# ──────────────────────────────────────────────────────────────────────────────
# Entry point
# ──────────────────────────────────────────────────────────────────────────────

def main() -> None:
    token = os.environ.get("TELEGRAM_TOKEN")
    if not token:
        raise RuntimeError("TELEGRAM_TOKEN environment variable is not set.")

    app = Application.builder().token(token).build()

    app.add_handler(CommandHandler("start", start))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CallbackQueryHandler(button))

    logger.info("BotDen4ik is running…")
    app.run_polling(allowed_updates=Update.ALL_TYPES)


if __name__ == "__main__":
    main()
