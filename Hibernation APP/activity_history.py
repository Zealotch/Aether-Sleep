"""Penyimpanan riwayat aktivitas lokal untuk Power Timer."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

import sys

if getattr(sys, 'frozen', False):
    BASE_DIR = Path(sys.executable).parent
else:
    BASE_DIR = Path(__file__).resolve().parent

DATA_DIRECTORY = BASE_DIR / "data"
HISTORY_FILE = DATA_DIRECTORY / "history.json"
MAX_ENTRIES = 100


def add_history(message: str, event_type: str = None, action_name: str = None) -> None:
    entries = get_history()
    new_entry = {"time": datetime.now().isoformat(timespec="seconds"), "message": message}
    if event_type:
        new_entry["event_type"] = event_type
    if action_name:
        new_entry["action_name"] = action_name
    entries.append(new_entry)
    DATA_DIRECTORY.mkdir(parents=True, exist_ok=True)
    HISTORY_FILE.write_text(json.dumps(entries[-MAX_ENTRIES:], ensure_ascii=False), encoding="utf-8")


def get_history() -> list[dict[str, str]]:
    try:
        data = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
        if not isinstance(data, list):
            return []
        return [entry for entry in data if isinstance(entry, dict) and "time" in entry and "message" in entry]
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return []

def get_stats() -> dict[str, int | float]:
    history = get_history()
    total_hibernations = 0
    total_schedules = 0
    total_cancels = 0
    
    for entry in history:
        msg = entry.get("message", "")
        ev_type = entry.get("event_type")
        act = entry.get("action_name")
        
        if ev_type == "execute":
            # Count any execution as a hibernation to maintain stat consistency
            total_hibernations += 1
        elif ev_type == "schedule":
            total_schedules += 1
        elif ev_type == "cancel":
            total_cancels += 1
        elif not ev_type:
            # Fallback for old string matching
            if "Menjalankan aksi: HIBERNATE" in msg or "Mengeksekusi aksi: HIBERNATE" in msg:
                total_hibernations += 1
            elif "Menjadwalkan" in msg or "Tidur disetel" in msg:
                total_schedules += 1
            elif "Jadwal dibatalkan" in msg or "Membatalkan" in msg:
                total_cancels += 1
    
    # Asumsi: 1 Hibernate = menghemat 6 jam idle PC
    # Rata-rata PC Idle = 50 Watt = 0.05 kW
    hours_saved = total_hibernations * 6
    kwh_saved = round(hours_saved * 0.05, 2)
    
    return {
        "hibernations": total_hibernations,
        "schedules": total_schedules,
        "cancels": total_cancels,
        "hours_saved": hours_saved,
        "kwh_saved": kwh_saved
    }
