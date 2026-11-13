-- Apply to an existing project to make new Quiz answers available across devices.
alter table public.attempts add column if not exists results jsonb;

create or replace function public.submit_quiz(p_lesson_id text, p_answers jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_key     jsonb;
  v_q       jsonb;
  v_mine    text;
  v_right   boolean;
  v_results jsonb := '[]'::jsonb;
  v_score   int := 0;
  v_total   int := 0;
begin
  if v_uid is null then
    raise exception 'unauthorized' using errcode = '28000';
  end if;
  select a.answers into v_key from public.quiz_answers a where a.lesson_id = p_lesson_id;
  if v_key is null or jsonb_typeof(p_answers) is distinct from 'array' then
    raise exception 'validation_error' using errcode = '22023';
  end if;

  for v_q in select e from jsonb_array_elements(v_key) with ordinality as t(e, n) order by n loop
    select x ->> 'choiceId' into v_mine
      from jsonb_array_elements(p_answers) x
      where x ->> 'questionId' = v_q ->> 'id'
      limit 1;
    v_right := v_mine is not distinct from (v_q ->> 'correct');
    v_total := v_total + 1;
    if v_right then v_score := v_score + 1; end if;
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'questionId', v_q ->> 'id', 'correct', v_right, 'yourChoiceId', v_mine,
      'correctChoiceId', v_q ->> 'correct', 'explanation', v_q ->> 'why'));
  end loop;

  insert into public.progress (user_id, lesson_id, score, total)
    values (v_uid, p_lesson_id, v_score, v_total)
    on conflict (user_id, lesson_id) do update set score = excluded.score, total = excluded.total, updated_at = now();
  insert into public.attempts (user_id, lesson_id, score, total, results)
    values (v_uid, p_lesson_id, v_score, v_total, v_results);

  return jsonb_build_object('score', v_score, 'total', v_total, 'percent', round(v_score * 100.0 / v_total), 'results', v_results);
end;
$$;

create or replace function public.my_state()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  select jsonb_build_object(
    'progress', coalesce((select jsonb_agg(jsonb_build_object('lessonId', lesson_id, 'score', score, 'total', total)) from public.progress), '[]'::jsonb),
    'attempts', coalesce((select jsonb_agg(jsonb_build_object('attemptId', id, 'lessonId', lesson_id, 'score', score, 'total', total, 'at', created_at, 'result', results) order by created_at, id) from public.attempts), '[]'::jsonb));
$$;
