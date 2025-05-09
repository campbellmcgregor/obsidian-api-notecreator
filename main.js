/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// main.ts
__export(exports, {
  default: () => APINoteImporterPlugin
});
var import_obsidian4 = __toModule(require("obsidian"));

// settings.ts
var import_obsidian = __toModule(require("obsidian"));
var DEFAULT_SETTINGS = {
  apiUrl: "",
  apiMethod: "GET",
  apiHeaders: {},
  pollingIntervalMinutes: 60,
  targetFolderPath: "",
  noteTitleTemplate: "{{id}} - {{title}}",
  noteBodyTemplate: "---\ntag: api_import\nsource_id: {{id}}\n---\n# {{title}}\n\n{{body}}",
  uniqueIdField: "id",
  skipDuplicates: true,
  duplicateCheckFrontmatterKey: "source_id"
};
var APINoteImporterSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "API Note Importer Settings" });
    containerEl.createEl("h3", { text: "API Configuration" });
    new import_obsidian.Setting(containerEl).setName("API URL").setDesc("The URL of the API endpoint to fetch data from.").addText((text) => text.setPlaceholder("https://api.example.com/data").setValue(this.plugin.settings.apiUrl).onChange(async (value) => {
      this.plugin.settings.apiUrl = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("HTTP Method").setDesc("The HTTP method to use for the API request.").addDropdown((dropdown) => dropdown.addOption("GET", "GET").addOption("POST", "POST").addOption("PUT", "PUT").addOption("DELETE", "DELETE").setValue(this.plugin.settings.apiMethod).onChange(async (value) => {
      this.plugin.settings.apiMethod = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("API Headers").setDesc("Headers to include in the API request (in JSON format). Useful for authentication tokens.").addTextArea((text) => text.setPlaceholder('{"Authorization": "Bearer YOUR_API_KEY"}').setValue(JSON.stringify(this.plugin.settings.apiHeaders, null, 2)).onChange(async (value) => {
      try {
        this.plugin.settings.apiHeaders = JSON.parse(value);
        await this.plugin.saveSettings();
      } catch (e) {
        console.error("Invalid JSON in API Headers:", e);
      }
    }));
    containerEl.createEl("h3", { text: "Polling Configuration" });
    new import_obsidian.Setting(containerEl).setName("Polling Interval (minutes)").setDesc("How often to fetch data from the API. Minimum 5 minutes.").addSlider((slider) => slider.setLimits(5, 1440, 5).setValue(this.plugin.settings.pollingIntervalMinutes).setDynamicTooltip().onChange(async (value) => {
      this.plugin.settings.pollingIntervalMinutes = value;
      await this.plugin.saveSettings();
      this.plugin.restartPolling();
    }));
    containerEl.createEl("h3", { text: "Note Creation Configuration" });
    new import_obsidian.Setting(containerEl).setName("Target Folder Path").setDesc("The folder where notes will be created. Leave empty for vault root.").addText((text) => text.setPlaceholder("folder/subfolder").setValue(this.plugin.settings.targetFolderPath).onChange(async (value) => {
      this.plugin.settings.targetFolderPath = value.trim();
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Note Title Template").setDesc("Template for the note title. Use {{field}} to insert data.").addText((text) => text.setPlaceholder("{{id}} - {{title}}").setValue(this.plugin.settings.noteTitleTemplate).onChange(async (value) => {
      this.plugin.settings.noteTitleTemplate = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Note Body Template").setDesc("Template for the note body. Use {{field}} to insert data.").addTextArea((text) => {
      text.setPlaceholder("---\ntag: api_import\nsource_id: {{id}}\n---\n# {{title}}\n\n{{body}}").setValue(this.plugin.settings.noteBodyTemplate).onChange(async (value) => {
        this.plugin.settings.noteBodyTemplate = value;
        await this.plugin.saveSettings();
      });
      text.inputEl.setAttr("rows", 10);
      text.inputEl.addClass("api-note-importer-body-template");
    });
    containerEl.createEl("h3", { text: "Duplicate Handling" });
    new import_obsidian.Setting(containerEl).setName("Unique ID Field").setDesc("The field in the API response to use as a unique identifier.").addText((text) => text.setPlaceholder("id").setValue(this.plugin.settings.uniqueIdField).onChange(async (value) => {
      this.plugin.settings.uniqueIdField = value.trim();
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Frontmatter Key for Duplicate Check").setDesc("The frontmatter key to check when looking for duplicates.").addText((text) => text.setPlaceholder("source_id").setValue(this.plugin.settings.duplicateCheckFrontmatterKey).onChange(async (value) => {
      this.plugin.settings.duplicateCheckFrontmatterKey = value.trim();
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Skip Duplicates").setDesc("Skip creating notes that already exist based on the unique ID.").addToggle((toggle) => toggle.setValue(this.plugin.settings.skipDuplicates).onChange(async (value) => {
      this.plugin.settings.skipDuplicates = value;
      await this.plugin.saveSettings();
    }));
    containerEl.createEl("h3", { text: "API Actions" });
    new import_obsidian.Setting(containerEl).setName("Test and Sync").setDesc("Test the API connection or manually trigger a sync").addButton((button) => button.setButtonText("Test Connection").onClick(async () => {
      await this.plugin.testApiConnection();
    })).addButton((button) => button.setButtonText("Sync Now").setCta().onClick(async () => {
      await this.plugin.fetchAndProcess(true);
    }));
  }
};

// api.ts
var import_obsidian2 = __toModule(require("obsidian"));
async function fetchData(settings) {
  try {
    if (!settings.apiUrl) {
      console.error("API URL is not configured");
      return null;
    }
    console.log(`Fetching data from ${settings.apiUrl} using ${settings.apiMethod}`);
    const response = await (0, import_obsidian2.requestUrl)({
      url: settings.apiUrl,
      method: settings.apiMethod,
      headers: settings.apiHeaders,
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      console.error(`API request failed with status ${response.status}: ${response.text}`);
      return null;
    }
    try {
      return response.json;
    } catch (parseError) {
      console.error("Failed to parse API response as JSON:", parseError);
      console.error("Response text:", response.text);
      return null;
    }
  } catch (error) {
    console.error("Error fetching data from API:", error);
    return null;
  }
}

// noteCreator.ts
var import_obsidian3 = __toModule(require("obsidian"));

// templating.ts
function applyTemplate(template, data) {
  return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const value = data[key];
    if (value === void 0 || value === null) {
      console.log(`Warning: Key "${key}" not found in data for template`);
      return "";
    }
    return String(value);
  });
}

// noteCreator.ts
async function createNotesFromData(data, settings, vault, metadataCache) {
  try {
    const dataArray = Array.isArray(data) ? data : [data];
    if (dataArray.length === 0) {
      console.log("No data items to process");
      return;
    }
    console.log(`Processing ${dataArray.length} data items`);
    await ensureFolder(vault, settings.targetFolderPath);
    for (const item of dataArray) {
      await processDataItem(item, settings, vault, metadataCache);
    }
    console.log("Note creation completed");
  } catch (error) {
    console.error("Error creating notes from data:", error);
  }
}
async function processDataItem(item, settings, vault, metadataCache) {
  let filePath = "";
  const uniqueId = item[settings.uniqueIdField];
  try {
    if (uniqueId === void 0 || uniqueId === null) {
      console.warn(`Unique ID field "${settings.uniqueIdField}" not found or null in data item:`, item);
      return;
    }
    if (settings.skipDuplicates) {
      const isDuplicate = await checkForDuplicate(uniqueId, settings, vault, metadataCache);
      if (isDuplicate) {
        return;
      }
    }
    const noteTitle = applyTemplate(settings.noteTitleTemplate, item);
    const noteBody = applyTemplate(settings.noteBodyTemplate, item);
    const sanitizedTitle = sanitizeFilename(noteTitle);
    if (!sanitizedTitle) {
      console.warn(`Skipping item with ID ${uniqueId} due to invalid or empty filename after sanitization from title: "${noteTitle}"`);
      return;
    }
    const normalizedFolderPath = settings.targetFolderPath ? (0, import_obsidian3.normalizePath)(settings.targetFolderPath) : "";
    filePath = normalizedFolderPath ? `${normalizedFolderPath}/${sanitizedTitle}.md` : `${sanitizedTitle}.md`;
    await vault.create(filePath, noteBody);
    console.log(`Created note: ${filePath}`);
  } catch (error) {
    if (error.message?.includes("File already exists")) {
      console.error(`Error processing data item with ID ${uniqueId}: File "${filePath}" already exists. This likely indicates a duplicate check failure or filename collision.`);
    } else {
      console.error(`Error processing data item with ID ${uniqueId} at path "${filePath}":`, error);
    }
    console.error("Data item causing error:", item);
  }
}
async function checkForDuplicate(uniqueId, settings, vault, metadataCache) {
  const normalizedFolderPath = settings.targetFolderPath ? (0, import_obsidian3.normalizePath)(settings.targetFolderPath) : "";
  const targetFolder = vault.getAbstractFileByPath(normalizedFolderPath);
  if (!(targetFolder instanceof import_obsidian3.TFolder)) {
    return false;
  }
  for (const file of targetFolder.children) {
    if (!(file instanceof import_obsidian3.TFile) || file.extension !== "md") {
      continue;
    }
    const fileCache = metadataCache.getFileCache(file);
    if (fileCache?.frontmatter) {
      const frontmatterValue = fileCache.frontmatter[settings.duplicateCheckFrontmatterKey];
      if (frontmatterValue !== void 0 && frontmatterValue !== null) {
        if (String(frontmatterValue) === String(uniqueId)) {
          console.log(`Skipping duplicate item with ID: ${uniqueId} (Found in: "${file.path}")`);
          return true;
        }
      }
    }
  }
  return false;
}
async function ensureFolder(vault, folderPath) {
  const normalizedPath = (0, import_obsidian3.normalizePath)(folderPath);
  if (!normalizedPath || normalizedPath === "/") {
    return;
  }
  try {
    const folder = vault.getAbstractFileByPath(normalizedPath);
    if (!folder) {
      await vault.createFolder(normalizedPath);
      console.log(`Created folder: ${normalizedPath}`);
    } else if (!(folder instanceof import_obsidian3.TFolder)) {
      console.error(`Error: Path "${normalizedPath}" exists but is not a folder.`);
      throw new Error(`Path "${normalizedPath}" exists but is not a folder.`);
    }
  } catch (error) {
    console.error(`Error ensuring folder "${normalizedPath}" exists:`, error);
    throw error;
  }
}
function sanitizeFilename(filename) {
  return filename.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

// main.ts
var PLUGIN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>`;
var APITestModal = class extends import_obsidian4.Modal {
  constructor(app, data) {
    super(app);
    this.data = data;
  }
  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "API Test Results" });
    const pre = contentEl.createEl("pre", {
      cls: "api-test-results",
      attr: { style: "max-height: 400px; overflow: auto; white-space: pre-wrap; word-break: break-all;" }
    });
    pre.setText(JSON.stringify(this.data, null, 2));
    const buttonContainer = contentEl.createDiv({ cls: "button-container", attr: { style: "text-align: right; margin-top: 1em;" } });
    buttonContainer.createEl("button", { text: "Close" }).addEventListener("click", () => {
      this.close();
    });
  }
  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
};
var APINoteImporterPlugin = class extends import_obsidian4.Plugin {
  constructor() {
    super(...arguments);
    this.intervalId = null;
  }
  async onload() {
    console.log("Loading API Note Importer plugin");
    (0, import_obsidian4.addIcon)("api-note-importer", PLUGIN_ICON);
    await this.loadSettings();
    this.addSettingTab(new APINoteImporterSettingTab(this.app, this));
    this.addCommand({
      id: "trigger-api-note-import",
      name: "Fetch data and create notes",
      icon: "api-note-importer",
      callback: () => this.fetchAndProcess(true)
    });
    this.startPolling();
  }
  onunload() {
    console.log("Unloading API Note Importer plugin");
    this.stopPolling();
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  startPolling() {
    this.stopPolling();
    const intervalMs = this.settings.pollingIntervalMinutes * 60 * 1e3;
    if (intervalMs > 0) {
      console.log(`Starting polling with interval of ${this.settings.pollingIntervalMinutes} minutes`);
      this.intervalId = window.setInterval(() => this.fetchAndProcess(false), intervalMs);
    }
  }
  stopPolling() {
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  restartPolling() {
    this.startPolling();
  }
  async fetchAndProcess(showNotifications) {
    try {
      if (!this.settings.apiUrl) {
        if (showNotifications) {
          new import_obsidian4.Notice("API URL is not configured. Please configure it in the settings.");
        }
        return;
      }
      if (showNotifications) {
        new import_obsidian4.Notice("Fetching data from API...");
      }
      const data = await fetchData(this.settings);
      if (!data) {
        if (showNotifications) {
          new import_obsidian4.Notice("Failed to fetch data from API. Check console for details.");
        }
        return;
      }
      await createNotesFromData(data, this.settings, this.app.vault, this.app.metadataCache);
      if (showNotifications) {
        new import_obsidian4.Notice("Notes created successfully.");
      }
    } catch (error) {
      console.error("Error in fetch and process:", error);
      if (showNotifications) {
        new import_obsidian4.Notice("Error fetching data or creating notes. Check console for details.");
      }
    }
  }
  async testApiConnection() {
    try {
      if (!this.settings.apiUrl) {
        new import_obsidian4.Notice("API URL is not configured. Please configure it in the settings.");
        return;
      }
      new import_obsidian4.Notice("Testing API connection...");
      const data = await fetchData(this.settings);
      if (!data) {
        new import_obsidian4.Notice("Failed to fetch data from API. Check console for details.");
        return;
      }
      let message = "API connection successful!";
      if (Array.isArray(data)) {
        message += ` Received ${data.length} items.`;
      } else {
        message += " Received data successfully.";
      }
      new import_obsidian4.Notice(message);
      console.log("API Test Response:", data);
      new APITestModal(this.app, data).open();
    } catch (error) {
      console.error("Error testing API connection:", error);
      new import_obsidian4.Notice("Error testing API connection. Check console for details.");
    }
  }
};
