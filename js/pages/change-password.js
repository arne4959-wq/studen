import { initPage } from "../shell.js";
import { changePassword } from "../api.js";
import { $, validate, rules, watchFields, setBusy, isLocked, setMessage, setFieldError, errorKey } from "../ui.js";

if (await initPage({ nav: "profile" })) {
  const form = $("#password-form");
  const { current, next, confirm } = form.elements;
  const submit = form.querySelector('[type="submit"]');
  const message = $("#form-msg");
  watchFields(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isLocked(submit)) return;
    setMessage(message, null);
    const valid = validate([
      [current, (v) => (v ? null : "validation.currentRequired")],
      [next, rules.password],
      [confirm, (v) => (!v ? "validation.confirmRequired" : v !== next.value ? "validation.mismatch" : null)],
    ]);
    if (!valid) return;
    setBusy(submit, true);
    try {
      await changePassword({ current: current.value, next: next.value });
      form.reset();
      setMessage(message, "password.changed", "success");
    } catch (error) {
      if (error.code === "wrong_password") {
        setFieldError(current, "errors.wrong_password");
        current.focus();
      } else {
        setMessage(message, errorKey(error));
      }
    } finally {
      setBusy(submit, false);
    }
  });
}
