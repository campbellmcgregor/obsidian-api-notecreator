import { requestUrl, RequestUrlResponse } from 'obsidian';
import { APINoteImporterSettings } from './settings';

/**
 * Fetches data from the API endpoint specified in the settings.
 * 
 * @param settings The plugin settings containing API configuration
 * @returns The parsed JSON data from the API, or null if an error occurred
 */
export async function fetchData(settings: APINoteImporterSettings): Promise<any | null> {
    try {
        if (!settings.apiUrl) {
            console.error('API URL is not configured');
            return null;
        }

        console.log(`Fetching data from ${settings.apiUrl} using ${settings.apiMethod}`);
        
        const response: RequestUrlResponse = await requestUrl({
            url: settings.apiUrl,
            method: settings.apiMethod,
            headers: settings.apiHeaders,
            throw: false // Don't throw on non-200 responses
        });

        // Check if the request was successful
        if (response.status < 200 || response.status >= 300) {
            console.error(`API request failed with status ${response.status}: ${response.text}`);
            return null;
        }

        // Try to parse the response as JSON
        try {
            return response.json;
        } catch (parseError) {
            console.error('Failed to parse API response as JSON:', parseError);
            console.error('Response text:', response.text);
            return null;
        }
    } catch (error) {
        console.error('Error fetching data from API:', error);
        return null;
    }
}