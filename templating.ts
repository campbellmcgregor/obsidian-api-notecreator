/**
 * Applies a template string to a data object, replacing placeholders with values.
 * Placeholders are in the format {{key}}.
 * 
 * @param template The template string with placeholders
 * @param data The data object containing values to replace placeholders
 * @returns The template with placeholders replaced by values
 */
export function applyTemplate(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
        const value = data[key];
        
        if (value === undefined || value === null) {
            console.log(`Warning: Key "${key}" not found in data for template`);
            return '';
        }
        
        return String(value);
    });
}