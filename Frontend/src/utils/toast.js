/**
 * Simple on-screen toast messages. Replaces alert() with non-blocking messages.
 * @param {string} message - Text to show
 * @param {'success'|'error'|'info'} type - Visual style
 * @param {number} durationMs - Auto-dismiss after (default 4000)
 */
export function showToast(message, type = "info", durationMs = 4000) {
  const container = document.getElementById("toast-container");
  if (!container) {
    const c = document.createElement("div");
    c.id = "toast-container";
    c.setAttribute("aria-live", "polite");
    document.body.appendChild(c);
  }
  const el = document.getElementById("toast-container");

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  el.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add("toast-visible"));

  const remove = () => {
    toast.classList.remove("toast-visible");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  };

  const t = setTimeout(remove, durationMs);
  toast.addEventListener("click", () => {
    clearTimeout(t);
    remove();
  });
}
