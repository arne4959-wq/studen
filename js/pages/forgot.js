import { initPage } from "../shell.js";
import { forgot } from "../api.js";
import { $, validate, rules, watchFields, setBusy, isLocked, setMessage, errorKey, toast } from "../ui.js";

if (await initPage({ auth: false, shell: false })) {
  const form = $("#forgot-form");
  const { email } = form.elements;
  const submit = form.querySelector('[type="submit"]');
  const resend = $("#resend");
  const message = $("#form-msg");
  watchFields(form);

  async function send(button) {
    if (isLocked(button)) return false;
    setMessage(message, null);
    setBusy(button, true);
    try {
      await forgot({ email: email.value.trim() });
      return true;
    } catch (error) {
      setMessage(message, errorKey(error));
      return false;
    } finally {
      setBusy(button, false);
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validate([[email, rules.email]]) || !(await send(submit))) return;
    form.hidden = true;
    $("#sent").hidden = false;
    $("#sent-title").focus();
  });

  resend.addEventListener("click", async () => {
    if (await send(resend)) toast("auth.forgot.resent");
  });
}
