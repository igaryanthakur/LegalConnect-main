import { adminService } from "../services/api.js";
import { showConfirm } from "../utils/toast.js";

function showToast(message, type = "info") {
  const existing = document.getElementById("admin-toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.id = "admin-toast";
  toast.className = `admin-toast admin-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("show"), 10);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function renderAdminPage() {
  const mainContent = document.getElementById("main-content");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  if (user.role !== "admin") {
    mainContent.innerHTML = `
      <div class="admin-forbidden">
        <h2><i class="fas fa-lock"></i> Access Denied</h2>
        <p>You need admin privileges to view this page.</p>
      </div>
    `;
    return;
  }

  mainContent.innerHTML = `
    <section class="admin-page">
      <h1 class="page-title"><i class="fas fa-shield-alt"></i> Admin Dashboard</h1>

      <div class="admin-dashboard" id="admin-dashboard">
        <div class="loading-spinner">Loading dashboard...</div>
      </div>

      <div class="admin-tabs" id="admin-tabs">
        <button class="admin-tab active" data-tab="users">Users</button>
        <button class="admin-tab" data-tab="topics">Topics</button>
        <button class="admin-tab" data-tab="lawyers">Lawyers</button>
        <button class="admin-tab" data-tab="resources">Resources</button>
        <button class="admin-tab" data-tab="consultations">Consultations</button>
      </div>

      <div class="admin-content" id="admin-content">
        <div class="loading-spinner">Loading...</div>
      </div>
    </section>
  `;

  loadDashboard();
  loadTabContent("users");

  document.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document
        .querySelectorAll(".admin-tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      loadTabContent(btn.dataset.tab);
    });
  });
}

async function loadDashboard() {
  const el = document.getElementById("admin-dashboard");
  try {
    const res = await adminService.getDashboard();
    const d = res.data.data;
    el.innerHTML = `
      <div class="admin-stats">
        <div class="stat-card">
          <i class="fas fa-users"></i>
          <span class="stat-value">${d.users}</span>
          <span class="stat-label">Users</span>
        </div>
        <div class="stat-card">
          <i class="fas fa-briefcase"></i>
          <span class="stat-value">${d.lawyers}</span>
          <span class="stat-label">Lawyers</span>
        </div>
        <div class="stat-card">
          <i class="fas fa-comments"></i>
          <span class="stat-value">${d.topics}</span>
          <span class="stat-label">Topics</span>
        </div>
        <div class="stat-card">
          <i class="fas fa-file-alt"></i>
          <span class="stat-value">${d.resources}</span>
          <span class="stat-label">Resources</span>
        </div>
        <div class="stat-card">
          <i class="fas fa-calendar-check"></i>
          <span class="stat-value">${d.consultations}</span>
          <span class="stat-label">Consultations</span>
        </div>
        <div class="stat-card stat-card-warning">
          <i class="fas fa-flag"></i>
          <span class="stat-value">${d.reportedTopicsCount}</span>
          <span class="stat-label">Reported Topics</span>
        </div>
      </div>
      ${
        d.topReportedTopics?.length
          ? `
        <div class="admin-reported">
          <h3><i class="fas fa-exclamation-triangle"></i> Top Reported Topics</h3>
          <ul>
            ${d.topReportedTopics
              .map(
                (t) => `
              <li>
                <span class="report-count">${t.reports} reports</span>
                <span class="report-title">${t.title}</span>
                <span class="report-meta">by ${t.author} · ${formatDate(t.createdAt)}</span>
              </li>
            `,
              )
              .join("")}
          </ul>
        </div>
      `
          : ""
      }
    `;
  } catch (err) {
    el.innerHTML = `<div class="error-message">${err.response?.data?.message || "Failed to load dashboard"}</div>`;
  }
}

async function loadTabContent(tab) {
  const el = document.getElementById("admin-content");
  el.innerHTML = '<div class="loading-spinner">Loading...</div>';

  try {
    if (tab === "users") {
      const res = await adminService.getUsers();
      renderUsersTable(el, res.data.data);
    } else if (tab === "topics") {
      const res = await adminService.getTopics();
      renderTopicsTable(el, res.data.data);
    } else if (tab === "lawyers") {
      const res = await adminService.getLawyers();
      renderLawyersTable(el, res.data.data);
    } else if (tab === "resources") {
      const res = await adminService.getResources();
      renderResourcesTable(el, res.data.data);
    } else if (tab === "consultations") {
      const res = await adminService.getConsultations();
      renderConsultationsTable(el, res.data.data);
    }
  } catch (err) {
    el.innerHTML = `<div class="error-message">${err.response?.data?.message || "Failed to load data"}</div>`;
  }
}

function renderUsersTable(el, items) {
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id ? String(currentUser.id) : null;
  el.innerHTML = `
    <div class="admin-search-container">
      <input type="text" class="admin-search-input" id="admin-search" placeholder="Search users by name, email, or role..." />
      <i class="fas fa-search admin-search-icon"></i>
    </div>
    <div class="admin-table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Joined</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (u) => `
            <tr>
              <td>${u.name || "-"}</td>
              <td>${u.email || "-"}</td>
              <td><span class="badge badge-${u.role}">${u.role}</span></td>
              <td>${formatDate(u.createdAt)}</td>
              <td>
                ${
                  String(u.id) === currentUserId
                    ? '<span class="text-muted">Current user</span>'
                    : `<button class="btn btn-sm btn-danger delete-btn" data-id="${u.id}" data-type="user"><i class="fas fa-trash"></i> Delete</button>`
                }
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      ${items.length === 0 ? '<p class="no-data">No users found.</p>' : ""}
    </div>
  `;
  attachDeleteHandlers(el, "user", adminService.deleteUser, () =>
    loadTabContent("users"),
  );
  attachSearchHandler();
}

function renderTopicsTable(el, items) {
  el.innerHTML = `
    <div class="admin-search-container">
      <input type="text" class="admin-search-input" id="admin-search" placeholder="Search topics by title, category, or author..." />
      <i class="fas fa-search admin-search-icon"></i>
    </div>
    <div class="admin-table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Category</th>
            <th>Author</th>
            <th>Reports</th>
            <th>Views</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (t) => `
            <tr>
              <td>${(t.title || "").slice(0, 50)}${(t.title || "").length > 50 ? "..." : ""}</td>
              <td>${t.category || "-"}</td>
              <td>${t.author || "-"}</td>
              <td>${t.reports || 0}</td>
              <td>${t.views || 0}</td>
              <td>${formatDate(t.createdAt)}</td>
              <td><button class="btn btn-sm btn-danger delete-btn" data-id="${t.id}" data-type="topic"><i class="fas fa-trash"></i> Delete</button></td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      ${items.length === 0 ? '<p class="no-data">No topics found.</p>' : ""}
    </div>
  `;
  attachDeleteHandlers(el, "topic", adminService.deleteTopic, () => {
    loadTabContent("topics");
    loadDashboard();
  });
  attachSearchHandler();
}

function renderLawyersTable(el, items) {
  el.innerHTML = `
    <div class="admin-search-container">
      <input type="text" class="admin-search-input" id="admin-search" placeholder="Search lawyers by name, email, or practice area..." />
      <i class="fas fa-search admin-search-icon"></i>
    </div>
    <div class="admin-table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Practice Areas</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (l) => `
            <tr>
              <td>${l.name || "-"}</td>
              <td>${l.email || "-"}</td>
              <td>${(l.practiceAreas || []).join(", ") || "-"}</td>
              <td><button class="btn btn-sm btn-danger delete-btn" data-id="${l.id}" data-type="lawyer"><i class="fas fa-trash"></i> Delete</button></td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      ${items.length === 0 ? '<p class="no-data">No lawyers found.</p>' : ""}
    </div>
  `;
  attachDeleteHandlers(el, "lawyer", adminService.deleteLawyer, () => {
    loadTabContent("lawyers");
    loadDashboard();
  });
  attachSearchHandler();
}

function renderResourcesTable(el, items) {
  el.innerHTML = `
    <div class="admin-search-container">
      <input type="text" class="admin-search-input" id="admin-search" placeholder="Search resources by title, type, or category..." />
      <i class="fas fa-search admin-search-icon"></i>
    </div>
    <button id="add-resource-btn" class="btn btn-primary" style="margin: 15px 0;"><i class="fas fa-plus"></i> Add New Resource</button>
    <div class="admin-table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Type</th>
            <th>Category</th>
            <th>File</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (r) => `
            <tr>
              <td>${(r.title || "").slice(0, 40)}${(r.title || "").length > 40 ? "..." : ""}</td>
              <td>${r.type || "-"}</td>
              <td>${r.category || "-"}</td>
              <td>${r.file ? '<i class="fas fa-file-pdf"></i>' : "-"}</td>
              <td>
                ${r.file ? `<a href="${r.file}" target="_blank" class="btn btn-sm btn-outline" title="Download"><i class="fas fa-download"></i></a>` : ""}
                <button class="btn btn-sm btn-danger delete-btn" data-id="${r.id}" data-type="resource"><i class="fas fa-trash"></i> Delete</button>
              </td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      ${items.length === 0 ? '<p class="no-data">No resources found.</p>' : ""}
    </div>
  `;

  // Add event listener for "Add New Resource" button
  const addBtn = el.querySelector("#add-resource-btn");
  if (addBtn) {
    addBtn.addEventListener("click", () => showAddResourceModal());
  }

  attachDeleteHandlers(el, "resource", adminService.deleteResource, () => {
    loadTabContent("resources");
    loadDashboard();
  });
  attachSearchHandler();
}

function renderConsultationsTable(el, items) {
  el.innerHTML = `
    <div class="admin-search-container">
      <input type="text" class="admin-search-input" id="admin-search" placeholder="Search consultations by lawyer, client, or status..." />
      <i class="fas fa-search admin-search-icon"></i>
    </div>
    <div class="admin-table-container">
      <table class="admin-table">
        <thead>
          <tr>
            <th>Lawyer</th>
            <th>Client</th>
            <th>Date</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (c) => `
            <tr>
              <td>${c.lawyerName || "-"}</td>
              <td>${c.clientName || "-"}</td>
              <td>${formatDate(c.date)}</td>
              <td><span class="badge badge-${c.status}">${c.status}</span></td>
              <td><button class="btn btn-sm btn-danger delete-btn" data-id="${c.id}" data-type="consultation"><i class="fas fa-trash"></i> Delete</button></td>
            </tr>
          `,
            )
            .join("")}
        </tbody>
      </table>
      ${items.length === 0 ? '<p class="no-data">No consultations found.</p>' : ""}
    </div>
  `;
  attachDeleteHandlers(
    el,
    "consultation",
    adminService.deleteConsultation,
    () => {
      loadTabContent("consultations");
      loadDashboard();
    },
  );
  attachSearchHandler();
}

function attachDeleteHandlers(container, type, deleteFn, onSuccess) {
  container.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      showConfirm(`Are you sure you want to delete this ${type}?`, async () => {
        btn.disabled = true;
        try {
          await deleteFn(id);
          showToast(
            `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`,
            "success",
          );
          onSuccess();
        } catch (err) {
          showToast(err.response?.data?.message || "Delete failed", "error");
          btn.disabled = false;
        }
      });
    });
  });
}

function attachSearchHandler() {
  const searchInput = document.getElementById("admin-search");
  if (!searchInput) return;

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase().trim();
    const table = document.querySelector(".admin-table tbody");
    if (!table) return;

    const rows = table.querySelectorAll("tr");
    let visibleCount = 0;

    rows.forEach((row) => {
      const text = row.textContent.toLowerCase();
      if (text.includes(searchTerm)) {
        row.style.display = "";
        visibleCount++;
      } else {
        row.style.display = "none";
      }
    });

    // Show/hide no results message
    const container = document.querySelector(".admin-table-container");
    let noResults = container.querySelector(".no-search-results");

    if (visibleCount === 0 && searchTerm) {
      if (!noResults) {
        noResults = document.createElement("p");
        noResults.className = "no-search-results no-data";
        noResults.textContent = "No results found for your search.";
        container.appendChild(noResults);
      }
    } else if (noResults) {
      noResults.remove();
    }
  });
}

function showAddResourceModal() {
  const modal = document.createElement("div");
  modal.className = "admin-modal-overlay";
  modal.innerHTML = `
    <div class="admin-modal" style="max-width: 600px;">
      <div class="admin-modal-header">
        <h3>Add New Resource</h3>
        <button class="admin-modal-close" aria-label="Close">&times;</button>
      </div>
      <form id="add-resource-form" class="admin-form" enctype="multipart/form-data">
        <div class="form-group">
          <label for="resource-title">Title *</label>
          <input type="text" id="resource-title" name="title" required placeholder="e.g., Know Your Rights: Tenant Basics">
        </div>
        
        <div class="form-group">
          <label for="resource-description">Description *</label>
          <textarea id="resource-description" name="description" required placeholder="Brief description of the resource" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label for="resource-type">Type *</label>
          <select id="resource-type" name="type" required>
            <option value="">Select Type</option>
            <option value="Guide">Guide</option>
            <option value="Template">Template</option>
            <option value="Video">Video</option>
            <option value="Article">Article</option>
          </select>
        </div>

        <div class="form-group">
          <label for="resource-category">Category *</label>
          <select id="resource-category" name="category" required>
            <option value="">Select Category</option>
            <option value="Housing & Tenant Rights">Housing & Tenant Rights</option>
            <option value="Family Law">Family Law</option>
            <option value="Employment Law">Employment Law</option>
            <option value="Consumer Rights">Consumer Rights</option>
            <option value="Civil Rights">Civil Rights</option>
            <option value="Criminal Defense">Criminal Defense</option>
            <option value="Immigration">Immigration</option>
            <option value="Traffic & Driving">Traffic & Driving</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div class="form-group">
          <label for="resource-file">PDF File</label>
          <input type="file" id="resource-file" name="file" accept=".pdf" placeholder="Upload PDF (optional)">
        </div>

        <div class="form-group">
          <label for="resource-content">Content/Text (optional)</label>
          <textarea id="resource-content" name="content" placeholder="Paste content or additional text" rows="3"></textarea>
        </div>

        <div class="form-group">
          <label for="resource-tags">Tags (comma-separated, optional)</label>
          <input type="text" id="resource-tags" name="tags" placeholder="e.g., tenant, rights, housing">
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary">Add Resource</button>
          <button type="button" class="btn btn-outline cancel-btn">Cancel</button>
        </div>
        <div id="resource-error-msg" style="color: red; margin-top: 10px; display: none;"></div>
        <div id="resource-success-msg" style="color: green; margin-top: 10px; display: none;"></div>
      </form>
    </div>
  `;

  document.body.appendChild(modal);

  // Close button
  modal.querySelector(".admin-modal-close").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Cancel button
  modal.querySelector(".cancel-btn").addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  // Close on overlay click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  // Form submission
  modal
    .querySelector("#add-resource-form")
    .addEventListener("submit", async (e) => {
      e.preventDefault();

      const errorMsg = modal.querySelector("#resource-error-msg");
      const successMsg = modal.querySelector("#resource-success-msg");
      const submitBtn = modal.querySelector("button[type='submit']");
      const fileInput = modal.querySelector("#resource-file");
      const contentInput = modal.querySelector("#resource-content");

      try {
        errorMsg.style.display = "none";
        successMsg.style.display = "none";

        // Validate that at least file or content is provided
        if (!fileInput.files.length && !contentInput.value.trim()) {
          errorMsg.textContent =
            "Please upload a PDF file or provide content text";
          errorMsg.style.display = "block";
          return;
        }

        submitBtn.disabled = true;

        const formData = new FormData(e.target);
        const response = await adminService.createResource(formData);

        if (response.data.success) {
          successMsg.textContent = "Resource created successfully!";
          successMsg.style.display = "block";
          setTimeout(() => {
            document.body.removeChild(modal);
            loadTabContent("resources");
            loadDashboard();
          }, 1500);
        } else {
          throw new Error(response.data.message || "Failed to create resource");
        }
      } catch (error) {
        errorMsg.textContent =
          error.response?.data?.message ||
          error.message ||
          "Failed to create resource";
        errorMsg.style.display = "block";
        submitBtn.disabled = false;
      }
    });
}
