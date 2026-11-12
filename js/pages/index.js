import { initPage } from "../shell.js";
import { getToken } from "../store.js";

if (await initPage({ auth: false, shell: false })) {
  window.location.replace(getToken() ? "subjects.html" : "login.html");
}
