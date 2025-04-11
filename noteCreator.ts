import { TFile, TFolder, Vault, MetadataCache, normalizePath } from 'obsidian';
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
    let filePath = ''; // Define filePath in a broader scope for error logging
    const uniqueId = item[settings.uniqueIdField];

    try {
        // Extract the unique ID from the data item
        if (uniqueId === undefined || uniqueId === null) {
            console.warn(`Unique ID field "${settings.uniqueIdField}" not found or null in data item:`, item);
            return; // Skip item if unique ID is missing
        }

        // Check for duplicates if enabled
        if (settings.skipDuplicates) {
            const isDuplicate = await checkForDuplicate(uniqueId, settings, vault, metadataCache);
            if (isDuplicate) {
                // Log is now inside checkForDuplicate
                return; // Skip duplicate
            }
        }

        // Apply templates to create note title and body
        const noteTitle = applyTemplate(settings.noteTitleTemplate, item);
        const noteBody = applyTemplate(settings.noteBodyTemplate, item);

        // Sanitize the title for use as a filename
        const sanitizedTitle = sanitizeFilename(noteTitle);

        // Add Check for valid filename
        if (!sanitizedTitle) {
             console.warn(`Skipping item with ID ${uniqueId} due to invalid or empty filename after sanitization from title: "${noteTitle}"`);
             return;
        }

        // Construct the full file path using normalizePath
        const normalizedFolderPath = settings.targetFolderPath ? normalizePath(settings.targetFolderPath) : '';
        filePath = normalizedFolderPath
            ? `${normalizedFolderPath}/${sanitizedTitle}.md`
            : `${sanitizedTitle}.md`; // Handle root vault case

        // Ensure the target folder exists (moved here to avoid redundant checks in loop)
        // Note: ensureFolder is called once before the loop now.

        // Create the note
        await vault.create(filePath, noteBody);
        console.log(`Created note: ${filePath}`); // Log line matches 206

    } catch (error) {
        // Provide more specific error logging
        if (error.message?.includes("File already exists")) {
             console.error(`Error processing data item with ID ${uniqueId}: File "${filePath}" already exists. This likely indicates a duplicate check failure or filename collision.`);
        } else {
             console.error(`Error processing data item with ID ${uniqueId} at path "${filePath}":`, error);
        }
        // Log the item that caused the error for debugging
        console.error("Data item causing error:", item);
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
    const normalizedFolderPath = settings.targetFolderPath ? normalizePath(settings.targetFolderPath) : '';
    const targetFolder = vault.getAbstractFileByPath(normalizedFolderPath);

    // If the target folder doesn't exist, no duplicates are possible yet.
    if (!(targetFolder instanceof TFolder)) {
        // This case is fine, folder will be created later if needed.
        // console.log(`Duplicate check: Target folder "${normalizedFolderPath}" not found.`);
        return false;
    }

    // Iterate through files in the folder
    for (const file of targetFolder.children) {
        // Ensure it's a Markdown TFile
        if (!(file instanceof TFile) || file.extension !== 'md') {
            continue;
        }

        // Get file cache - use await for potentially async operations in future?
        // For now, getFileCache is synchronous.
        const fileCache = metadataCache.getFileCache(file);

        // Check frontmatter if cache and frontmatter exist
        if (fileCache?.frontmatter) {
            const frontmatterValue = fileCache.frontmatter[settings.duplicateCheckFrontmatterKey];

            // Check if the configured key exists and compare its value (as string)
            if (frontmatterValue !== undefined && frontmatterValue !== null) {
                if (String(frontmatterValue) === String(uniqueId)) {
                    console.log(`Skipping duplicate item with ID: ${uniqueId} (Found in: "${file.path}")`); // Log line matches 196
                    return true; // Duplicate found
                }
            }
        }
    }

    return false; // No duplicate found in the target folder
}

/**
 * Ensures that a folder exists in the vault, creating it if necessary.
 * 
 * @param vault The Obsidian vault
 * @param folderPath The path of the folder to ensure
 */
async function ensureFolder(vault: Vault, folderPath: string): Promise<void> {
    // Normalize path and check if it's empty or root
    const normalizedPath = normalizePath(folderPath);
    if (!normalizedPath || normalizedPath === '/') {
        return; // No need to create root
    }

    try {
        // Check if folder exists
        const folder = vault.getAbstractFileByPath(normalizedPath);

        if (!folder) {
            // Folder doesn't exist, create it recursively
            await vault.createFolder(normalizedPath);
            console.log(`Created folder: ${normalizedPath}`); // Log line matches 246
        } else if (!(folder instanceof TFolder)) {
            // Path exists but is not a folder
            console.error(`Error: Path "${normalizedPath}" exists but is not a folder.`);
            throw new Error(`Path "${normalizedPath}" exists but is not a folder.`);
        }
        // Folder exists, do nothing
    } catch (error) {
        console.error(`Error ensuring folder "${normalizedPath}" exists:`, error);
        // Re-throw or handle as needed, maybe prevent note creation if folder fails
        throw error;
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