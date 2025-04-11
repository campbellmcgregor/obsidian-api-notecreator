import { Plugin, Notice, addIcon, Modal, App } from 'obsidian';
import { APINoteImporterSettings, APINoteImporterSettingTab, DEFAULT_SETTINGS } from './settings';
import { fetchData } from './api';
import { createNotesFromData } from './noteCreator';

// Define the plugin icon
const PLUGIN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"></path><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path><path d="M2 2l7.586 7.586"></path><circle cx="11" cy="11" r="2"></circle></svg>`;

/**
 * Modal to display the API test results.
 */
class APITestModal extends Modal {
    data: any;

    constructor(app: App, data: any) {
        super(app);
        this.data = data;
    }

    onOpen() {
        const { contentEl } = this;
        
        contentEl.createEl('h2', { text: 'API Test Results' });
        
        // Create a pre element for the JSON data
        const pre = contentEl.createEl('pre', { 
            cls: 'api-test-results',
            attr: { style: 'max-height: 400px; overflow: auto; white-space: pre-wrap; word-break: break-all;' }
        });
        
        // Format the JSON data
        pre.setText(JSON.stringify(this.data, null, 2));
        
        // Add a close button
        const buttonContainer = contentEl.createDiv({ cls: 'button-container', attr: { style: 'text-align: right; margin-top: 1em;' } });
        
        buttonContainer.createEl('button', { text: 'Close' })
            .addEventListener('click', () => {
                this.close();
            });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}

export default class APINoteImporterPlugin extends Plugin {
    settings: APINoteImporterSettings;
    intervalId: number | null = null;

    async onload() {
        console.log('Loading API Note Importer plugin');

        // Register the plugin icon
        addIcon('api-note-importer', PLUGIN_ICON);

        // Load settings
        await this.loadSettings();

        // Register settings tab
        this.addSettingTab(new APINoteImporterSettingTab(this.app, this));

        // Register command for manual triggering
        this.addCommand({
            id: 'trigger-api-note-import',
            name: 'Fetch data and create notes',
            icon: 'api-note-importer',
            callback: () => this.fetchAndProcess(true)
        });

        // Start polling
        this.startPolling();
    }

    onunload() {
        console.log('Unloading API Note Importer plugin');
        this.stopPolling();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    /**
     * Starts the polling interval based on the configured interval.
     */
    startPolling() {
        this.stopPolling(); // Clear any existing interval

        const intervalMs = this.settings.pollingIntervalMinutes * 60 * 1000;
        
        if (intervalMs > 0) {
            console.log(`Starting polling with interval of ${this.settings.pollingIntervalMinutes} minutes`);
            this.intervalId = window.setInterval(() => this.fetchAndProcess(false), intervalMs);
        }
    }

    /**
     * Stops the polling interval.
     */
    stopPolling() {
        if (this.intervalId !== null) {
            window.clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Restarts the polling interval (used when settings change).
     */
    restartPolling() {
        this.startPolling();
    }

    /**
     * Fetches data from the API and processes it to create notes.
     * 
     * @param showNotifications Whether to show notifications for the process
     */
    async fetchAndProcess(showNotifications: boolean) {
        try {
            if (!this.settings.apiUrl) {
                if (showNotifications) {
                    new Notice('API URL is not configured. Please configure it in the settings.');
                }
                return;
            }

            if (showNotifications) {
                new Notice('Fetching data from API...');
            }

            // Fetch data from the API
            const data = await fetchData(this.settings);

            if (!data) {
                if (showNotifications) {
                    new Notice('Failed to fetch data from API. Check console for details.');
                }
                return;
            }

            // Create notes from the data
            await createNotesFromData(data, this.settings, this.app.vault, this.app.metadataCache);

            if (showNotifications) {
                new Notice('Notes created successfully.');
            }
        } catch (error) {
            console.error('Error in fetch and process:', error);
            
            if (showNotifications) {
                new Notice('Error fetching data or creating notes. Check console for details.');
            }
        }
    }
    
    /**
     * Tests the API connection with the current settings.
     * Displays the results in a notification.
     */
    async testApiConnection() {
        try {
            if (!this.settings.apiUrl) {
                new Notice('API URL is not configured. Please configure it in the settings.');
                return;
            }

            new Notice('Testing API connection...');

            // Fetch data from the API
            const data = await fetchData(this.settings);

            if (!data) {
                new Notice('Failed to fetch data from API. Check console for details.');
                return;
            }

            // Show success notification with some info about the data
            let message = 'API connection successful!';
            
            if (Array.isArray(data)) {
                message += ` Received ${data.length} items.`;
            } else {
                message += ' Received data successfully.';
            }
            
            new Notice(message);
            
            // Log the data to the console for inspection
            console.log('API Test Response:', data);
            
            // Open a modal to display the data
            new APITestModal(this.app, data).open();
        } catch (error) {
            console.error('Error testing API connection:', error);
            new Notice('Error testing API connection. Check console for details.');
        }
    }
}