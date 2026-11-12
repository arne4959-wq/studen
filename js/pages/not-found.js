import { initPage } from "../shell.js";
import { $, setText } from "../ui.js";

if (await initPage({ auth: false, shell: false })) {
  const path = window.location.pathname;
  setText($("#nf-cmd"), "notFound.command", { path });
  setText($("#nf-line"), "notFound.line", { path });
}
