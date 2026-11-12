"""Turns sysupport.md (the teacher's System Support summary) into the app's data/*.json entries.
Run:  python3 -I build_repair.py   (writes into ../studen/data). Safe to re-run: it replaces the "repair" subject.
Thai text is copied verbatim from the source, never retyped."""
import json, re, pathlib

HERE = pathlib.Path(__file__).parent
DATA = HERE.parent / "studen" / "data"
src = (HERE / "sysupport.md").read_text(encoding="utf8").splitlines()

clean = lambda s: s.replace("**", "").replace("`", "").strip()

# ---- split into chapters / quiz / answers ----
chapters, quiz_lines, answer_lines, cur = [], [], [], None
mode = "chapter"
for line in src:
    if line.startswith("## บทที่ "):
        cur = {"heading": clean(line[3:]), "lines": []}
        chapters.append(cur); mode = "chapter"
    elif line.startswith("## แบบทดสอบ"):
        mode = "quiz"
    elif line.startswith("## เฉลย"):
        mode = "answers"
    elif mode == "chapter" and cur is not None:
        cur["lines"].append(line)
    elif mode == "quiz":
        quiz_lines.append(line)
    elif mode == "answers":
        answer_lines.append(line)

# ---- chapters ----
lessons, summaries, by_first_number = [], {}, {}
for idx, ch in enumerate(chapters, 1):
    m = re.match(r"บทที่ (\d+)(?:–(\d+))? · (.+)", ch["heading"])
    first, last, title = int(m.group(1)), m.group(2), m.group(3)
    if last:
        title = f"{title} (บทที่ {first}–{last})"
    lid = f"r{idx:02d}"
    intro, points, table_rows, table_head = None, [], [], None
    pending_table = []
    for line in ch["lines"] + [""]:
        s = line.rstrip()
        if s.startswith("|"):
            pending_table.append([clean(c) for c in s.strip().strip("|").split("|")])
            continue
        if pending_table:
            rows = [r for r in pending_table if not set("".join(r)) <= set("-")]
            table_head, table_rows = rows[0], rows[1:]
            pending_table = []
        if not s.strip() or s.startswith("<embed>"):
            continue
        if s.startswith("  - "):
            points.append("– " + clean(s[4:]))
        elif s.startswith("- "):
            points.append(clean(s[2:]))
        elif intro is None:
            intro = clean(s)
        else:
            points.append(clean(s))          # a stray paragraph (e.g. caption of the bus diagram) stays as a point
    # 2-column table: first column + everything else joined, headers named after the source columns
    headers, rows2 = None, []
    if table_rows:
        h = table_head
        headers = [h[0], "รายละเอียด"]
        for r in table_rows:
            parts = []
            for name, cell in zip(h[1:], r[1:]):
                if cell in ("—", "-", ""):
                    continue
                if name.startswith("ขา DIMM"): cell = f"DIMM {cell} ขา"
                elif name.startswith("ขา SO-DIMM"): cell = f"SO-DIMM {cell} ขา"
                elif name.startswith("ไฟ"): cell = f"{cell} V"
                elif name == "ตัวอย่าง": cell = f"ตัวอย่าง: {cell}"
                parts.append(cell)
            rows2.append({"from": r[0], "to": " · ".join(parts)})
    chars = len(intro or "") + sum(map(len, points)) + sum(len(r["from"]) + len(r["to"]) for r in rows2)
    summary = {"id": lid, "title": title, "readMinutes": max(2, round(chars / 450)), "intro": intro, "keyPoints": points, "bookRef": ""}
    if rows2:
        summary["table"], summary["tableHeaders"] = rows2, headers
    summaries[lid] = summary
    lessons.append({"id": lid, "order": first, "slug": re.sub(r"[^a-z0-9]+", "_", title.lower().split(" (")[0]).strip("_"),
                    "title": title, "status": "todo", "bookRef": "", "level": 1 if first <= 8 else 2})
    by_first_number[first] = lid

# ---- quiz (15 questions) + answers ----
LETTER = {"ก": "a", "ข": "b", "ค": "c", "ง": "d"}
questions, qi = [], None
for line in quiz_lines:
    m = re.match(r"(\d+)\. (.+)", line)
    if m:
        qi = {"n": int(m.group(1)), "text": clean(m.group(2)), "choices": []}
        questions.append(qi)
        continue
    m = re.match(r"\s+- ([กขคง])\. (.+)", line)
    if m and qi:
        qi["choices"].append({"id": LETTER[m.group(1)], "label": clean(m.group(2))})
assert len(questions) == 15 and all(len(q["choices"]) == 4 for q in questions)

answers_src = {}
for line in answer_lines:
    m = re.match(r"\| (\d+) \| ([กขคง])\. (.+?) \| (.+) \|$", line)
    if m:
        answers_src[int(m.group(1))] = (LETTER[m.group(2)], clean(m.group(4)))
assert len(answers_src) == 15

# which slide chapter each question belongs to (by the topic it tests)
QUESTION_CHAPTER = {1: 1, 2: 2, 3: 2, 4: 3, 5: 5, 6: 6, 7: 6, 8: 7, 9: 8, 10: 9, 11: 10, 12: 11, 13: 11, 14: 12, 15: 12}
quizzes, answers = {}, {}
for q in questions:
    lid = by_first_number[QUESTION_CHAPTER[q["n"]]]
    bucket = quizzes.setdefault(lid, {"lessonId": lid, "questions": []})
    qid = f"q{len(bucket['questions']) + 1}"
    bucket["questions"].append({"id": qid, "text": q["text"], "choices": q["choices"]})
    letter, why = answers_src[q["n"]]
    answers.setdefault(lid, {})[qid] = {"correctChoiceId": letter, "explanation": why}
assert set(quizzes) == {l["id"] for l in lessons}, "every lesson needs at least one question"

# ---- merge into the app's data files ----
def load(name): return json.loads((DATA / f"{name}.json").read_text(encoding="utf8"))
def save(name, obj): (DATA / f"{name}.json").write_text(json.dumps(obj, ensure_ascii=False, indent=2) + "\n", encoding="utf8")

subjects = [s for s in load("subjects") if s["id"] != "repair"]
subjects.append({"id": "repair", "name": "ສ້ອມແປງຄອມພິວເຕີ", "lessonCount": len(lessons), "doneCount": 0})
save("subjects", subjects)
d = load("lessons"); d["repair"] = lessons; save("lessons", d)
EXTRAS = ("image", "photos", "examples", "tryIt", "idea")   # written by hand on top of the slides (picture, photos, stories, tasks): keep them on a re-run
for name, new in (("summaries", summaries), ("quizzes", quizzes), ("answers", answers)):
    d = load(name)
    if name == "summaries":
        for lid, s in new.items():
            s.update({k: d[lid][k] for k in EXTRAS if k in d.get(lid, {})})
    for k in [k for k in d if k.startswith("r") and k[1:].isdigit()]:
        del d[k]
    d.update(new); save(name, d)
print(f"{len(lessons)} lessons, {len(questions)} questions")
for l in lessons:
    print(l["order"], l["id"], l["level"], l["title"], "|", len(summaries[l["id"]]["keyPoints"]), "points,", len(quizzes[l["id"]]["questions"]), "q,", summaries[l["id"]]["readMinutes"], "min", "table" if "table" in summaries[l["id"]] else "")
