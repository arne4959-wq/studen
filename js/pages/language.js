import { initPage } from "../shell.js";
import { getLang, setLang } from "../i18n.js";
import { $, setMessage } from "../ui.js";

if (await initPage({ nav: "profile" })) {
  const form = $("#lang-form");
  const message = $("#lang-msg");
  form.elements.lang.value = getLang();
  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("change", async (event) => {
    try {
      await setLang(event.target.value);
      setMessage(message, "language.changed", "success");
    } catch {
      form.elements.lang.value = getLang();
      setMessage(message, "errors.network_error");
    }
  });
}
