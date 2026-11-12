import { initPage } from "../shell.js";
import { register } from "../api.js";
import { setSession } from "../store.js";
import { $, validate, rules, watchFields, setBusy, isLocked, setMessage, setFieldError, errorKey } from "../ui.js";

if (await initPage({ auth: false, guest: true, shell: false })) {
  const form = $("#register-form");
  const { username, email, password, confirm } = form.elements;
  const submit = form.querySelector('[type="submit"]');
  const message = $("#form-msg");
  watchFields(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isLocked(submit)) return;
    setMessage(message, null);
    const valid = validate([
      [username, (v) => (v.trim().length < 2 ? "validation.username" : null)],
      [email, rules.email],
      [password, rules.password],
      [confirm, (v) => (!v ? "validation.confirmRequired" : v !== password.value ? "validation.mismatch" : null)],
    ]);
    const flag = (count) => setMessage(message, "auth.register.checkFields", "error", { n: count });
    if (!valid) return flag(form.querySelectorAll('[aria-invalid="true"]').length);
    setBusy(submit, true);
    try {
      setSession(await register({ username: username.value.trim(), email: email.value.trim(), password: password.value }));
      window.location.replace("subjects.html");
    } catch (error) {
      setBusy(submit, false);
      if (error.code === "email_taken") {
        setFieldError(email, "errors.email_taken");
        flag(1);
        email.focus();
      } else {
        setMessage(message, errorKey(error));
      }
    }
  });
}
