import { App, PluginSettingTab, Setting } from 'obsidian';
import APINoteImporterPlugin from './main';

export interface APINoteImporterSettings {
    apiUrl: string;
    apiMethod: string;
    apiHeaders: Record<string, string>;
    pollingIntervalMinutes: number;
    targetFolderPath: string;
    noteTitleTemplate: string;
    noteBodyTemplate: string;
    uniqueIdField: string;
    skipDuplicates: boolean;
    duplicateCheckFrontmatterKey: string;
}

export const DEFAULT_SETTINGS: APINoteImporterSettings = {
    apiUrl: '',
    apiMethod: 'GET',
    apiHeaders: {},
    pollingIntervalMinutes: 60,
    targetFolderPath: '',
    noteTitleTemplate: '{{id}} - {{title}}',
    noteBodyTemplate: '---\ntag: api_import\nsource_id: {{id}}\n---\n# {{title}}\n\n{{body}}',
    uniqueIdField: 'id',
    skipDuplicates: true,
    duplicateCheckFrontmatterKey: 'source_id'
};

export class APINoteImporterSettingTab extends PluginSettingTab {
    plugin: APINoteImporterPlugin;

    constructor(app: App, plugin: APINoteImporterPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl('h2', { text: 'API Note Importer Settings' });

        // API Configuration Section
        containerEl.createEl('h3', { text: 'API Configuration' });

        new Setting(containerEl)
            .setName('API URL')
            .setDesc('The URL of the API endpoint to fetch data from.')
            .addText(text => text
                .setPlaceholder('https://api.example.com/data')
                .setValue(this.plugin.settings.apiUrl)
                .onChange(async (value) => {
                    this.plugin.settings.apiUrl = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('HTTP Method')
            .setDesc('The HTTP method to use for the API request.')
            .addDropdown(dropdown => dropdown
                .addOption('GET', 'GET')
                .addOption('POST', 'POST')
                .addOption('PUT', 'PUT')
                .addOption('DELETE', 'DELETE')
                .setValue(this.plugin.settings.apiMethod)
                .onChange(async (value) => {
                    this.plugin.settings.apiMethod = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('API Headers')
            .setDesc('Headers to include in the API request (in JSON format). Useful for authentication tokens.')
            .addTextArea(text => text
                .setPlaceholder('{"Authorization": "Bearer YOUR_API_KEY"}')
                .setValue(JSON.stringify(this.plugin.settings.apiHeaders, null, 2))
                .onChange(async (value) => {
                    try {
                        this.plugin.settings.apiHeaders = JSON.parse(value);
                        await this.plugin.saveSettings();
                    } catch (e) {
                        console.error('Invalid JSON in API Headers:', e);
                        // Optionally provide user feedback here
                    }
                }));

        // Polling Configuration
        containerEl.createEl('h3', { text: 'Polling Configuration' });

        new Setting(containerEl)
            .setName('Polling Interval (minutes)')
            .setDesc('How often to fetch data from the API. Minimum 5 minutes.')
            .addSlider(slider => slider
                .setLimits(5, 1440, 5) // Min 5 minutes, Max 24 hours
                .setValue(this.plugin.settings.pollingIntervalMinutes)
                .setDynamicTooltip()
                .onChange(async (value) => {
                    this.plugin.settings.pollingIntervalMinutes = value;
                    await this.plugin.saveSettings();
                    this.plugin.restartPolling(); // Restart polling with new interval
                }));

        // Note Creation Configuration
        containerEl.createEl('h3', { text: 'Note Creation Configuration' });

        new Setting(containerEl)
            .setName('Target Folder Path')
            .setDesc('The folder where notes will be created. Leave empty for vault root.')
            .addText(text => text
                .setPlaceholder('folder/subfolder')
                .setValue(this.plugin.settings.targetFolderPath)
                .onChange(async (value) => {
                    // Basic validation/sanitization could be added here
                    this.plugin.settings.targetFolderPath = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Note Title Template')
            .setDesc('Template for the note title. Use {{field}} to insert data.')
            .addText(text => text
                .setPlaceholder('{{id}} - {{title}}')
                .setValue(this.plugin.settings.noteTitleTemplate)
                .onChange(async (value) => {
                    this.plugin.settings.noteTitleTemplate = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Note Body Template')
            .setDesc('Template for the note body. Use {{field}} to insert data.')
            .addTextArea(text => {
                text
                    .setPlaceholder('---\ntag: api_import\nsource_id: {{id}}\n---\n# {{title}}\n\n{{body}}')
                    .setValue(this.plugin.settings.noteBodyTemplate)
                    .onChange(async (value) => {
                        this.plugin.settings.noteBodyTemplate = value;
                        await this.plugin.saveSettings();
                    });
                // Set initial size for the textarea
                text.inputEl.setAttr('rows', 10);
                // Add a class for potential CSS targeting
                text.inputEl.addClass('api-note-importer-body-template');
            });

        // Duplicate Handling Configuration
        containerEl.createEl('h3', { text: 'Duplicate Handling' });

        new Setting(containerEl)
            .setName('Unique ID Field')
            .setDesc('The field in the API response to use as a unique identifier.')
            .addText(text => text
                .setPlaceholder('id')
                .setValue(this.plugin.settings.uniqueIdField)
                .onChange(async (value) => {
                    this.plugin.settings.uniqueIdField = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Frontmatter Key for Duplicate Check')
            .setDesc('The frontmatter key to check when looking for duplicates.')
            .addText(text => text
                .setPlaceholder('source_id')
                .setValue(this.plugin.settings.duplicateCheckFrontmatterKey)
                .onChange(async (value) => {
                    this.plugin.settings.duplicateCheckFrontmatterKey = value.trim();
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Skip Duplicates')
            .setDesc('Skip creating notes that already exist based on the unique ID.')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.skipDuplicates)
                .onChange(async (value) => {
                    this.plugin.settings.skipDuplicates = value;
                    await this.plugin.saveSettings();
                }));

        // API Actions
        containerEl.createEl('h3', { text: 'API Actions' });

        new Setting(containerEl)
            .setName('Test and Sync')
            .setDesc('Test the API connection or manually trigger a sync')
            .addButton(button => button
                .setButtonText('Test Connection')
                .onClick(async () => {
                    await this.plugin.testApiConnection();
                }))
            .addButton(button => button
                .setButtonText('Sync Now')
                .setCta() // Make this the prominent button
                .onClick(async () => {
                    await this.plugin.fetchAndProcess(true); // Pass true to show notifications
                }));
    }
}