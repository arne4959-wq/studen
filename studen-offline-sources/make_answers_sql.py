"""Prints the SQL that fills public.quiz_answers from ../data/answers.json + ../data/quizzes.json (question order).
Run:  python3 -I make_answers_sql.py > /tmp/answers.sql   then run that file on the database. Do not commit the output."""
import json, pathlib

DATA = pathlib.Path(__file__).parent.parent / "data"
quizzes, answers = (json.loads((DATA / f"{n}.json").read_text(encoding="utf8")) for n in ("quizzes", "answers"))
lit = lambda s: "'" + s.replace("'", "''") + "'"
rows = []
for lesson, quiz in quizzes.items():
    key = [{"id": q["id"], "correct": answers[lesson][q["id"]]["correctChoiceId"], "why": answers[lesson][q["id"]]["explanation"]} for q in quiz["questions"]]
    rows.append(f"({lit(lesson)}, {lit(json.dumps(key, ensure_ascii=False, separators=(',', ':')))}::jsonb)")
print("insert into public.quiz_answers (lesson_id, answers) values\n" + ",\n".join(rows) +
      "\non conflict (lesson_id) do update set answers = excluded.answers;")
