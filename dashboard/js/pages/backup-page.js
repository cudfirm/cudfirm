/** CUDFIRM Phase 6.1 — Backup & Restore UI */
const BackupPage = (() => {
  let importedBackup = null;
  let importedKeys = [];
  let busy = false;

  function checkboxList(prefix, keys, defaults = keys) {
    return BackupApi.SECTIONS.filter((section) => keys.includes(section.key)).map((section) => `
      <label class="backup-section-option">
        <input class="form-check-input" type="checkbox" name="${prefix}" value="${esc(section.key)}" ${defaults.includes(section.key) ? "checked" : ""}>
        <span class="backup-section-icon"><i class="bi ${esc(section.icon)}" aria-hidden="true"></i></span>
        <span><strong>${esc(section.label)}</strong>${section.note ? `<small>${esc(section.note)}</small>` : ""}${section.sensitive ? `<small class="backup-sensitive">Contains personal data</small>` : ""}</span>
      </label>`).join("");
  }

  function selected(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((input) => input.value);
  }

  function setBusy(value, label = "Working…") {
    busy = value;
    document.querySelectorAll("[data-backup-action]").forEach((button) => {
      if (value) {
        button.disabled = true;
        return;
      }
      if (button.id === "restoreBackupBtn") {
        const acknowledge = document.getElementById("backupAcknowledge");
        button.disabled = !acknowledge || !acknowledge.checked;
      } else {
        button.disabled = false;
      }
    });
    const status = document.getElementById("backupOperationStatus");
    if (status) status.innerHTML = value ? `<i class="bi bi-arrow-repeat" aria-hidden="true"></i> ${esc(label)}` : "";
  }

  function render() {
    const root = document.getElementById("page-content");
    const allKeys = BackupApi.SECTIONS.map((section) => section.key);
    root.innerHTML = `
      <section class="backup-hero dash-card">
        <div>
          <div class="backup-kicker"><i class="bi bi-shield-check" aria-hidden="true"></i> Phase 6.1</div>
          <h1>Protect your CMS content</h1>
          <p>Create a portable JSON backup or restore selected sections from a previous CUDFIRM backup.</p>
        </div>
        <div class="backup-scope-note">
          <i class="bi bi-info-circle" aria-hidden="true"></i>
          <span>Database content only. Authentication, passwords, project secrets, and actual Storage files are excluded.</span>
        </div>
      </section>

      <div class="backup-grid">
        <section class="dash-card backup-panel" aria-labelledby="createBackupTitle">
          <div class="backup-panel-head">
            <div><span class="backup-step">1</span><h2 id="createBackupTitle">Create backup</h2></div>
            <i class="bi bi-cloud-arrow-down" aria-hidden="true"></i>
          </div>
          <p>Select the sections to include. The downloaded file is readable JSON and includes a timestamp and record counts.</p>
          <div class="backup-select-actions">
            <button class="btn btn-sm btn-outline-secondary" type="button" data-select-all="backupExportSections">Select all</button>
            <button class="btn btn-sm btn-outline-secondary" type="button" data-clear-all="backupExportSections">Clear</button>
          </div>
          <div class="backup-section-list">${checkboxList("backupExportSections", allKeys, allKeys)}</div>
          <button class="btn btn-brand backup-primary-action" id="createBackupBtn" data-backup-action type="button">
            <i class="bi bi-download" aria-hidden="true"></i> Download JSON backup
          </button>
        </section>

        <section class="dash-card backup-panel" aria-labelledby="restoreBackupTitle">
          <div class="backup-panel-head">
            <div><span class="backup-step">2</span><h2 id="restoreBackupTitle">Restore backup</h2></div>
            <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i>
          </div>
          <p>Choose a CUDFIRM JSON backup. Nothing changes until you preview, select sections, and confirm the restore.</p>
          <label class="backup-file-drop" for="backupFileInput" id="backupFileDrop">
            <i class="bi bi-file-earmark-arrow-up" aria-hidden="true"></i>
            <strong>Choose backup file</strong>
            <span>JSON only · maximum 25 MB</span>
            <input type="file" id="backupFileInput" accept="application/json,.json" hidden>
          </label>
          <div id="backupFileSummary" class="backup-file-summary" aria-live="polite"></div>
          <div id="backupRestoreOptions"></div>
        </section>
      </div>
      <div class="backup-operation-status" id="backupOperationStatus" role="status" aria-live="polite"></div>
    `;

    bindBaseEvents();
  }

  function bindBaseEvents() {
    document.querySelectorAll("[data-select-all]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll(`input[name="${button.dataset.selectAll}"]`).forEach((input) => { input.checked = true; });
    }));
    document.querySelectorAll("[data-clear-all]").forEach((button) => button.addEventListener("click", () => {
      document.querySelectorAll(`input[name="${button.dataset.clearAll}"]`).forEach((input) => { input.checked = false; });
    }));
    document.getElementById("createBackupBtn").addEventListener("click", createBackup);
    document.getElementById("backupFileInput").addEventListener("change", handleFile);

    const drop = document.getElementById("backupFileDrop");
    ["dragenter", "dragover"].forEach((eventName) => drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.add("is-dragging"); }));
    ["dragleave", "drop"].forEach((eventName) => drop.addEventListener(eventName, (event) => { event.preventDefault(); drop.classList.remove("is-dragging"); }));
    drop.addEventListener("drop", (event) => {
      const file = event.dataTransfer.files && event.dataTransfer.files[0];
      if (file) loadFile(file);
    });
  }

  async function createBackup() {
    if (busy) return;
    const keys = selected("backupExportSections");
    if (!keys.length) return DashToast.error("Select at least one section to back up.");
    setBusy(true, "Creating backup…");
    const { backup, errors } = await BackupApi.createBackup(keys);
    setBusy(false);
    if (!Object.keys(backup.sections).length) return DashToast.error("The backup could not be created.");
    BackupApi.download(backup);
    await DashActivity.log("backed up", "database", `${keys.length} section${keys.length === 1 ? "" : "s"}`, { sections: keys, partial_errors: errors.length });
    if (errors.length) DashToast.error(`Backup downloaded, but ${errors.length} section${errors.length === 1 ? "" : "s"} could not be read.`);
    else DashToast.success("Backup downloaded successfully.");
  }

  function handleFile(event) {
    const file = event.target.files && event.target.files[0];
    if (file) loadFile(file);
  }

  async function loadFile(file) {
    if (busy) return;
    const summary = document.getElementById("backupFileSummary");
    summary.innerHTML = `<div class="loading-state"><i class="bi bi-arrow-repeat" aria-hidden="true"></i> Reading backup…</div>`;
    document.getElementById("backupRestoreOptions").innerHTML = "";
    try {
      const parsed = await BackupApi.readFile(file);
      const validation = BackupApi.validateBackup(parsed);
      if (!validation.valid) throw new Error(validation.errors[0]);
      importedBackup = parsed;
      importedKeys = validation.availableKeys;
      const total = importedKeys.reduce((sum, key) => sum + parsed.sections[key].length, 0);
      summary.innerHTML = `
        <div class="backup-file-valid">
          <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
          <div><strong>${esc(file.name)}</strong><span>${total.toLocaleString()} records · Created ${esc(formatDate(parsed.created_at))}</span></div>
        </div>`;
      renderRestoreOptions();
    } catch (error) {
      importedBackup = null;
      importedKeys = [];
      summary.innerHTML = `<div class="backup-file-invalid"><i class="bi bi-exclamation-triangle" aria-hidden="true"></i>${esc(error.message || "The backup file could not be read.")}</div>`;
      DashToast.error(error.message || "The backup file could not be read.");
    }
  }

  function formatDate(value) {
    if (!value) return "an unknown date";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "an unknown date" : date.toLocaleString();
  }

  function renderRestoreOptions() {
    const target = document.getElementById("backupRestoreOptions");
    target.innerHTML = `
      <div class="backup-restore-box">
        <div class="backup-select-actions">
          <button class="btn btn-sm btn-outline-secondary" type="button" data-select-all="backupRestoreSections">Select all</button>
          <button class="btn btn-sm btn-outline-secondary" type="button" data-clear-all="backupRestoreSections">Clear</button>
        </div>
        <div class="backup-section-list backup-restore-list">
          ${checkboxList("backupRestoreSections", importedKeys, importedKeys).replace(/<strong>(.*?)<\/strong>/g, (match, label) => match)}
        </div>
        <div class="backup-restore-warning">
          <i class="bi bi-exclamation-triangle" aria-hidden="true"></i>
          <span><strong>Replace mode:</strong> each selected section’s current records will be replaced by this backup. A safety backup of the selected current data will download automatically first.</span>
        </div>
        <label class="backup-confirm-check">
          <input class="form-check-input" type="checkbox" id="backupAcknowledge">
          <span>I understand that selected database sections will be replaced.</span>
        </label>
        <button class="btn btn-danger backup-primary-action" id="restoreBackupBtn" data-backup-action type="button" disabled>
          <i class="bi bi-arrow-counterclockwise" aria-hidden="true"></i> Preview and restore selected sections
        </button>
      </div>`;

    target.querySelectorAll("[data-select-all]").forEach((button) => button.addEventListener("click", () => {
      target.querySelectorAll(`input[name="${button.dataset.selectAll}"]`).forEach((input) => { input.checked = true; });
    }));
    target.querySelectorAll("[data-clear-all]").forEach((button) => button.addEventListener("click", () => {
      target.querySelectorAll(`input[name="${button.dataset.clearAll}"]`).forEach((input) => { input.checked = false; });
    }));
    const acknowledge = document.getElementById("backupAcknowledge");
    const restoreButton = document.getElementById("restoreBackupBtn");
    acknowledge.addEventListener("change", () => { restoreButton.disabled = !acknowledge.checked; });
    restoreButton.addEventListener("click", confirmRestore);
  }

  function previewText(keys) {
    return keys.map((key) => {
      const section = BackupApi.SECTIONS.find((item) => item.key === key);
      const count = importedBackup.sections[key].length;
      return `• ${section.label}: ${count.toLocaleString()} record${count === 1 ? "" : "s"}`;
    }).join("\n");
  }

  async function confirmRestore() {
    if (busy || !importedBackup) return;
    const keys = selected("backupRestoreSections");
    if (!keys.length) return DashToast.error("Select at least one section to restore.");

    const empty = keys.filter((key) => importedBackup.sections[key].length === 0);
    const message = `The following sections will be replaced:\n\n${previewText(keys)}\n\n${empty.length ? "Warning: one or more selected sections are empty and will be cleared.\n\n" : ""}A safety backup will download first. Continue?`;
    if (!window.confirm(message)) return;

    setBusy(true, "Creating safety backup…");
    const safety = await BackupApi.createBackup(keys, { reason: "pre-restore-safety" });
    if (!Object.keys(safety.backup.sections).length) {
      setBusy(false);
      return DashToast.error("Restore stopped because the safety backup could not be created.");
    }
    BackupApi.download(safety.backup, BackupApi.filename("cudfirm-pre-restore-safety"));

    setBusy(true, "Restoring selected sections…");
    const results = await BackupApi.restoreBackup(importedBackup, keys, ({ section, index, total }) => {
      setBusy(true, `Restoring ${section.label} (${index + 1} of ${total})…`);
    });
    setBusy(false);

    const failed = results.find((result) => result.error);
    const restored = results.filter((result) => !result.error).map((result) => result.key);
    await DashActivity.log("restored", "database", `${restored.length} section${restored.length === 1 ? "" : "s"}`, { sections: restored, source_created_at: importedBackup.created_at, failed: failed ? failed.key : null });

    if (failed) {
      DashToast.error(`Restore stopped at ${failed.label}. Your pre-restore safety backup has been downloaded.`);
      showRestoreResult(results, false);
      return;
    }
    DashToast.success("Selected sections restored successfully.");
    showRestoreResult(results, true);
  }

  function showRestoreResult(results, success) {
    const box = document.getElementById("backupRestoreOptions");
    box.innerHTML = `
      <div class="backup-result ${success ? "is-success" : "is-error"}" role="status">
        <i class="bi ${success ? "bi-check-circle-fill" : "bi-exclamation-triangle-fill"}" aria-hidden="true"></i>
        <div>
          <strong>${success ? "Restore completed" : "Restore stopped before completion"}</strong>
          <ul>${results.map((result) => `<li>${esc(result.label)} — ${result.error ? "failed" : result.skipped ? "no backup row to restore" : `${result.count} restored`}</li>`).join("")}</ul>
          <button class="btn btn-outline-secondary btn-sm" type="button" id="restoreAnotherBtn">Choose another backup</button>
        </div>
      </div>`;
    document.getElementById("restoreAnotherBtn").addEventListener("click", () => {
      importedBackup = null;
      importedKeys = [];
      document.getElementById("backupFileInput").value = "";
      document.getElementById("backupFileSummary").innerHTML = "";
      document.getElementById("backupRestoreOptions").innerHTML = "";
    });
  }

  function init() { render(); }
  return { init };
})();
