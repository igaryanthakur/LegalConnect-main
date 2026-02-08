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

/**
 * Show a confirm modal (replaces browser confirm()). Calls onConfirm() or onCancel() when user clicks.
 * @param {string} message - Text to show
 * @param {() => void} onConfirm - Called when user clicks Confirm
 * @param {() => void} [onCancel] - Called when user clicks Cancel or closes
 */
export function showConfirm(message, onConfirm, onCancel = () => {}) {
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.setAttribute("role", "dialog");
  modal.innerHTML = `
    <div class="modal-content confirm-modal">
      <p class="confirm-message">${message}</p>
      <div class="confirm-actions">
        <button type="button" class="btn btn-primary confirm-ok-btn">Confirm</button>
        <button type="button" class="btn btn-outline confirm-cancel-btn">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  const remove = () => {
    if (modal.parentNode) modal.parentNode.removeChild(modal);
  };
  modal.querySelector(".confirm-ok-btn").addEventListener("click", () => {
    remove();
    onConfirm();
  });
  modal.querySelector(".confirm-cancel-btn").addEventListener("click", () => {
    remove();
    onCancel();
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      remove();
      onCancel();
    }
  });
}
