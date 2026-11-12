import { initPage } from "../shell.js";
import { login } from "../api.js";
import { USE_MOCK } from "../config.js";
import { setSession } from "../store.js";
import { safeNext } from "../guard.js";
import { $, param, validate, rules, watchFields, setBusy, isLocked, setMessage, setFieldError, errorKey } from "../ui.js";

if (await initPage({ auth: false, guest: true, shell: false })) {
  const form = $("#login-form");
  const { email, password } = form.elements;
  const submit = form.querySelector('[type="submit"]');
  const message = $("#form-msg");
  $("#mock-hint").hidden = !USE_MOCK;
  watchFields(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (isLocked(submit)) return;
    setMessage(message, null);
    if (!validate([[email, rules.email], [password, rules.required("validation.passwordRequired")]])) return;
    setBusy(submit, true);
    try {
      setSession(await login({ email: email.value.trim(), password: password.value }));
      window.location.replace(safeNext(param("next")));
    } catch (error) {
      setBusy(submit, false);
      setMessage(message, errorKey(error));
      if (error.status === 401) {
        setFieldError(password, "auth.login.checkPassword");
        password.focus();
        password.select();
      }
    }
  });
}
