"""Озвучка «Көршілер» через ElevenLabs: реплики из таблицы → out/kz/<id>.mp3 и out/ru/<id>.mp3 (игра ищет звук по id).
Основа — tts_test.py Виталия; добавлено: голоса в voices.json, выбор модели, выравнивание громкости и обрезка тишины.

1) В ElevenLabs подобрать голос каждому герою, скопировать его Voice ID в voice/voices.json:
     {"grump": "...", "apa": "...", "hero": "..."}
2) Ключ — только в переменную окружения, в файлы и в чат не вставлять:
     Windows (PowerShell):  $env:ELEVEN_API_KEY="ваш_ключ"
     macOS / Linux:          export ELEVEN_API_KEY=ваш_ключ
3) Из корня репозитория:
     pip install requests
     python voice/ozvuchit.py voice/proba_tur1_grump_apa.csv --dry        # посмотреть, что будет озвучено
     python voice/ozvuchit.py voice/proba_tur1_grump_apa.csv               # озвучить (готовые файлы пропускает)
     python voice/ozvuchit.py voice/proba_tur1_grump_apa.csv --only grump_init_no --force   # переозвучить одну строку
   Модель: --model eleven_v3 (по умолчанию, как у Виталия) или другая, если на слух лучше.
Если установлен ffmpeg — громкость выравнивается до −16 LUFS, тишина по краям обрезается, моно 44,1 кГц 128 кбит/с.
"""
import argparse, csv, json, os, shutil, subprocess, sys
import requests

TAGS = {"greet": "", "good": "[interested]", "meh": "[hesitant]", "bad": "[annoyed]", "yes": "[warmly]",
        "no": "[firmly]", "think": "[thoughtful]", "abstain": "[evasive]", "online": "[cheerful]",
        "story": "[sighs]", "hold": "[insistent]", "flee": "[whispers]"}
LANG = {"kz": "kk", "ru": "ru"}
HERE = os.path.dirname(os.path.abspath(__file__))

def post(path):
    """−16 LUFS, тишина по краям ≤ 0,2 с, моно, 44,1 кГц, 128 кбит/с — по требованиям Виталия."""
    if not shutil.which("ffmpeg"): return
    tmp = path + ".tmp.mp3"
    f = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse,"
         "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,loudnorm=I=-16:TP=-1.5:LRA=11")
    r = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", path, "-af", f, "-ac", "1", "-ar", "44100", "-b:a", "128k", tmp])
    if r.returncode == 0: os.replace(tmp, path)
    elif os.path.exists(tmp): os.remove(tmp)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lines"); ap.add_argument("--lang", default="kz,ru")
    ap.add_argument("--model", default="eleven_v3"); ap.add_argument("--only", default="")
    ap.add_argument("--dry", action="store_true"); ap.add_argument("--force", action="store_true")
    ap.add_argument("--no-tags", action="store_true", help="без эмоциональных тегов (если модель их не понимает)")
    a = ap.parse_args()
    voices = json.load(open(os.path.join(HERE, "voices.json"), encoding="utf-8")) if os.path.exists(os.path.join(HERE, "voices.json")) else {}
    key = os.environ.get("ELEVEN_API_KEY")
    rows = list(csv.DictReader(open(a.lines, encoding="utf-8-sig"), delimiter=";"))
    if a.only: rows = [r for r in rows if r["id"] in a.only.split(",")]
    print("реплик:", len(rows), "· модель:", a.model)
    for r in rows:
        for lg in a.lang.split(","):
            tag = "" if a.no_tags else TAGS.get(r["ключ"], "")
            text = (tag + " " + r[lg]).strip()
            sub = r["герой"] if r["герой"] in ("hero_f", "hero_m") else ""   # героиня и герой — в своих папках
            out = os.path.join("out", lg, sub, r["id"] + ".mp3")
            print(f"{lg} {r['id']} [{r['герой']}] → {text}")
            if a.dry or (os.path.exists(out) and not a.force): continue
            vid = voices.get(r["герой"])
            if not key: sys.exit("Нет ELEVEN_API_KEY (см. шаг 2 в начале файла)")
            if not vid: sys.exit(f"Нет Voice ID для «{r['герой']}» в voice/voices.json")
            resp = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                                 headers={"xi-api-key": key, "Content-Type": "application/json"},
                                 json={"text": text, "model_id": a.model, "language_code": LANG[lg]}, timeout=120)
            if resp.status_code != 200: print("  ошибка:", resp.status_code, resp.text[:300]); continue
            os.makedirs(os.path.dirname(out), exist_ok=True); open(out, "wb").write(resp.content); post(out)

if __name__ == "__main__": main()
