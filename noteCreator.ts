import { TFile, TFolder, Vault, MetadataCache } from 'obsidian';
import { APINoteImporterSettings } from './settings';
import { applyTemplate } from './templating';

/**
 * Creates notes in the Obsidian vault based on data fetched from the API.
 * 
 * @param data The data fetched from the API
 * @param settings The plugin settings
 * @param vault The Obsidian vault
 * @param metadataCache The Obsidian metadata cache
 * @returns A promise that resolves when all notes have been created
 */
export async function createNotesFromData(
    data: any, 
    settings: APINoteImporterSettings, 
    vault: Vault, 
    metadataCache: MetadataCache
): Promise<void> {
    try {
        // Normalize data to an array
        const dataArray = Array.isArray(data) ? data : [data];
        
        if (dataArray.length === 0) {
            console.log('No data items to process');
            return;
        }
        
        console.log(`Processing ${dataArray.length} data items`);
        
        // Ensure the target folder exists
        await ensureFolder(vault, settings.targetFolderPath);
        
        // Process each data item
        for (const item of dataArray) {
            await processDataItem(item, settings, vault, metadataCache);
        }
        
        console.log('Note creation completed');
    } catch (error) {
        console.error('Error creating notes from data:', error);
    }
}

/**
 * Processes a single data item and creates a note for it if it's not a duplicate.
 * 
 * @param item The data item to process
 * @param settings The plugin settings
 * @param vault The Obsidian vault
 * @param metadataCache The Obsidian metadata cache
 */
async function processDataItem(
    item: any, 
    settings: APINoteImporterSettings, 
    vault: Vault, 
    metadataCache: MetadataCache
): Promise<void> {
    try {
        // Extract the unique ID from the data item
        const uniqueId = item[settings.uniqueIdField];
        
        if (uniqueId === undefined || uniqueId === null) {
            console.warn(`Unique ID field "${settings.uniqueIdField}" not found in data item:`, item);
            return;
        }
        
        // Check for duplicates if enabled
        if (settings.skipDuplicates) {
            const isDuplicate = await checkForDuplicate(uniqueId, settings, vault, metadataCache);
            
            if (isDuplicate) {
                console.log(`Skipping duplicate item with ID: ${uniqueId}`);
                return;
            }
        }
        
        // Apply templates to create note title and body
        const noteTitle = applyTemplate(settings.noteTitleTemplate, item);
        const noteBody = applyTemplate(settings.noteBodyTemplate, item);
        
        // Sanitize the title for use as a filename
        const sanitizedTitle = sanitizeFilename(noteTitle);
        
        // Construct the full file path
        const folderPath = settings.targetFolderPath.endsWith('/') 
            ? settings.targetFolderPath 
            : settings.targetFolderPath + '/';
        const filePath = `${folderPath}${sanitizedTitle}.md`;
        
        // Create the note
        await vault.create(filePath, noteBody);
        console.log(`Created note: ${filePath}`);
    } catch (error) {
        console.error('Error processing data item:', error);
    }
}

/**
 * Checks if a note with the same unique ID already exists.
 * 
 * @param uniqueId The unique ID to check for
 * @param settings The plugin settings
 * @param vault The Obsidian vault
 * @param metadataCache The Obsidian metadata cache
 * @returns True if a duplicate exists, false otherwise
 */
async function checkForDuplicate(
    uniqueId: any, 
    settings: APINoteImporterSettings, 
    vault: Vault, 
    metadataCache: MetadataCache
): Promise<boolean> {
    // Get all markdown files in the target folder
    const folder = vault.getAbstractFileByPath(settings.targetFolderPath);
    
    if (!folder || !(folder instanceof TFolder)) {
        return false;
    }
    
    const files = folder.children.filter((file: any) => file instanceof TFile && file.extension === 'md');
    
    // Check each file's frontmatter for the unique ID
    for (const file of files) {
        if (!(file instanceof TFile)) continue;
        
        const metadata = metadataCache.getFileCache(file);
        
        if (metadata && metadata.frontmatter) {
            const frontmatterValue = metadata.frontmatter[settings.duplicateCheckFrontmatterKey];
            
            if (frontmatterValue !== undefined && String(frontmatterValue) === String(uniqueId)) {
                return true;
            }
        }
    }
    
    return false;
}

/**
 * Ensures that a folder exists in the vault, creating it if necessary.
 * 
 * @param vault The Obsidian vault
 * @param folderPath The path of the folder to ensure
 */
async function ensureFolder(vault: Vault, folderPath: string): Promise<void> {
    if (!folderPath || folderPath === '/') {
        return;
    }
    
    const folderExists = vault.getAbstractFileByPath(folderPath) instanceof TFolder;
    
    if (!folderExists) {
        try {
            // Split the path into segments and create each folder level
            const pathSegments = folderPath.split('/').filter(segment => segment.length > 0);
            let currentPath = '';
            
            for (const segment of pathSegments) {
                currentPath += segment;
                
                if (!vault.getAbstractFileByPath(currentPath)) {
                    await vault.createFolder(currentPath);
                }
                
                currentPath += '/';
            }
            
            console.log(`Created folder: ${folderPath}`);
        } catch (error) {
            console.error(`Error creating folder ${folderPath}:`, error);
            throw error;
        }
    }
}

/**
 * Sanitizes a string for use as a filename.
 * 
 * @param filename The filename to sanitize
 * @returns The sanitized filename
 */
function sanitizeFilename(filename: string): string {
    // Replace characters that are invalid in filenames
    return filename
        .replace(/[\\/:*?"<>|]/g, '-') // Replace invalid characters with hyphens
        .replace(/\s+/g, ' ')          // Replace multiple spaces with a single space
        .trim();                        // Remove leading/trailing spaces
}