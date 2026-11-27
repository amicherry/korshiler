"""Озвучка «Көршілер» через ElevenLabs: реплики из таблицы → out/kz/<id>.mp3 и out/ru/<id>.mp3 (игра ищет звук по id).
Основа — tts_test.py Виталия; добавлено: голоса в voices.json, выбор модели, выравнивание громкости и обрезка тишины.

1) В ElevenLabs подобрать голос каждому герою, скопировать его Voice ID в voice/voices.json:
     {"grump": "...", "apa": "...", "hero": "..."}
2) Ключ — только в переменную окружения, в файлы и в чат не вставлять:
     Проще всего: скопировать .env.example в .env (в корне проекта) и вписать ключ после ELEVEN_API_KEY=
     .env в git не попадает. Или в терминале:
     Windows (PowerShell):  $env:ELEVEN_API_KEY="ваш_ключ"
     macOS / Linux:          export ELEVEN_API_KEY=ваш_ключ
3) Из корня репозитория:
     pip install requests
     python voice/ozvuchit.py --all --dry          # что ещё не озвучено и сколько это символов (кредитов)
     python voice/ozvuchit.py --all                # озвучить ВСЁ, чего ещё нет (готовые файлы пропускает)
     python voice/ozvuchit.py --all --who hero_f   # только героиня (можно несколько: --who apa,grump)
     python voice/ozvuchit.py voice/voice_lines.csv --only grump_init_no --force   # переозвучить одну строку
   Если у героя нет Voice ID в voices.json — его строки пропускаются (не ошибка), в конце будет список.
   Можно прервать (Ctrl+C) и запустить снова — продолжит с того места.
   Модель: --model eleven_v3 (по умолчанию, как у Виталия) или другая, если на слух лучше.
Если установлен ffmpeg — громкость выравнивается до −16 LUFS, тишина по краям обрезается, моно 44,1 кГц 128 кбит/с.
"""
import time, argparse, csv, json, os, shutil, subprocess, sys
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

def read_env():
    """Ключ можно положить в файл .env в корне проекта: ELEVEN_API_KEY=sk_...  (.env не попадает в git)"""
    p, d = os.path.join(HERE, "..", ".env"), {}
    if os.path.exists(p):
        for line in open(p, encoding="utf-8-sig"):
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1); d[k.strip()] = v.strip().strip('"').strip("'")
    return d

ALL = ["voice_lines.csv", "voice_extra.csv", "geroinya.csv"]

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("lines", nargs="*"); ap.add_argument("--all", action="store_true", help="все таблицы реплик сразу")
    ap.add_argument("--who", default="", help="только эти герои, через запятую: hero_f,apa"); ap.add_argument("--lang", default="kz,ru")
    ap.add_argument("--model", default="eleven_v3"); ap.add_argument("--only", default="")
    ap.add_argument("--dry", action="store_true"); ap.add_argument("--force", action="store_true")
    ap.add_argument("--no-tags", action="store_true", help="без эмоциональных тегов (если модель их не понимает)")
    a = ap.parse_args()
    voices = json.load(open(os.path.join(HERE, "voices.json"), encoding="utf-8")) if os.path.exists(os.path.join(HERE, "voices.json")) else {}
    key = os.environ.get("ELEVEN_API_KEY") or read_env().get("ELEVEN_API_KEY")
    files = [os.path.join(HERE, f) for f in ALL] if a.all else a.lines
    if not files: sys.exit("Укажи таблицу реплик или --all")
    rows = [r for f in files for r in csv.DictReader(open(f, encoding="utf-8-sig"), delimiter=";")]
    if a.only: rows = [r for r in rows if r["id"] in a.only.split(",")]
    for r in rows:   # мужской герой из общей таблицы («hero») — в папку hero_m, героиня — в hero_f
        if r["герой"] == "hero": r["герой"] = "hero_m"
    if a.who: rows = [r for r in rows if r["герой"] in a.who.split(",")]
    todo, chars, novoice, done = [], 0, {}, 0
    for r in rows:
        for lg in a.lang.split(","):
            sub = r["герой"] if r["герой"] in ("hero_f", "hero_m") else ""
            out = os.path.join("out", lg, sub, r["id"] + ".mp3")
            if os.path.exists(out) and not a.force: continue
            vid = voices.get(r["герой"]) or (voices.get("hero") if r["герой"] == "hero_m" else "")
            if not vid: novoice[r["герой"]] = novoice.get(r["герой"], 0) + 1; continue
            tag = "" if a.no_tags or r["герой"] in ("hero_f", "hero_m") else TAGS.get(r["ключ"], "")
            text = (tag + " " + r[lg]).strip(); chars += len(text); todo.append((r, lg, text, out, vid))
    print(f"к озвучке: {len(todo)} файлов, ≈{chars} символов (кредитов) · модель: {a.model}")
    if novoice: print("пропущено — нет Voice ID в voices.json:", ", ".join(f"{k} ({v})" for k, v in sorted(novoice.items())))
    if a.dry:
        for r, lg, text, out, _ in todo[:40]: print(f"  {out} → {text}")
        if len(todo) > 40: print(f"  … и ещё {len(todo) - 40}")
        return
    if todo and not key: sys.exit("Нет ELEVEN_API_KEY (см. шаг 2 в начале файла)")
    for i, (r, lg, text, out, vid) in enumerate(todo, 1):
        print(f"[{i}/{len(todo)}] {out}")
        resp = None
        for attempt in range(5):   # связь оборвалась — ждём и пробуем ещё раз, а не падаем
            try:
                resp = requests.post(f"https://api.elevenlabs.io/v1/text-to-speech/{vid}?output_format=mp3_44100_128",
                                     headers={"xi-api-key": key, "Content-Type": "application/json"},
                                     json={"text": text, "model_id": a.model, "language_code": LANG[lg]}, timeout=120)
                if resp.status_code in (429, 500, 502, 503, 504) and attempt < 4 and "quota" not in resp.text:
                    print(f"  сервер занят ({resp.status_code}), жду…"); time.sleep(5 * (attempt + 1)); continue
                break
            except requests.exceptions.RequestException as e:
                print(f"  связь оборвалась ({type(e).__name__}), повтор {attempt + 1}/5…"); time.sleep(5 * (attempt + 1))
        if resp is None: print("  пропущено: нет связи. Запусти скрипт ещё раз позже — он доделает."); continue
        if resp.status_code != 200:
            print("  ошибка:", resp.status_code, resp.text[:300])
            if resp.status_code in (401, 402, 429) or "quota" in resp.text: sys.exit("Остановлено: ключ не подходит или закончились кредиты. Готовые файлы сохранены.")
            continue
        os.makedirs(os.path.dirname(out), exist_ok=True); open(out, "wb").write(resp.content); post(out); done += 1
    print("готово:", done, "файлов")

if __name__ == "__main__": main()
