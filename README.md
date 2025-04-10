# API Note Importer for Obsidian

This plugin automatically fetches data from a user-specified REST API endpoint and creates corresponding notes within Obsidian.

## Features

- Periodically poll a REST API endpoint and create notes from the data
- Configure the API endpoint URL, HTTP method, and headers
- Set a custom polling interval (minimum 5 minutes)
- Specify a target folder for note creation
- Use customizable templates for note titles and content
- Prevent duplicate notes based on a unique identifier
- Manually trigger data fetching and note creation

## Installation

### From Obsidian Community Plugins

1. Open Obsidian
2. Go to Settings > Community plugins
3. Turn off Safe mode if it's on
4. Click "Browse" and search for "API Note Importer"
5. Install the plugin
6. Enable the plugin after installation

### Manual Installation

1. Download the latest release from the [releases page](https://github.com/yourusername/obsidian-api-note-importer/releases)
2. Extract the zip file into your Obsidian vault's `.obsidian/plugins` folder
3. Reload Obsidian
4. Enable the plugin in Settings > Community plugins

## Configuration

### API Configuration

- **API URL**: The URL of the API endpoint to fetch data from
- **HTTP Method**: The HTTP method to use for the API request (GET, POST, PUT, DELETE)
- **API Headers**: Headers to include in the API request (in JSON format), useful for authentication tokens

### Polling Configuration

- **Polling Interval**: How often to fetch data from the API (in minutes, minimum 5)

### Note Creation Configuration

- **Target Folder Path**: The folder where notes will be created
- **Note Title Template**: Template for the note title, using `{{field}}` placeholders
- **Note Body Template**: Template for the note body, using `{{field}}` placeholders

### Duplicate Handling

- **Unique ID Field**: The field in the API response to use as a unique identifier
- **Frontmatter Key for Duplicate Check**: The frontmatter key to check when looking for duplicates
- **Skip Duplicates**: Whether to skip creating notes that already exist based on the unique ID

## Usage

### Templates

Templates use a simple placeholder syntax: `{{field}}` where `field` is a property in the API response data.

#### Example API Response:

```json
{
  "id": "123",
  "title": "Sample Item",
  "description": "This is a sample item",
  "created_at": "2023-01-01T12:00:00Z"
}
```

#### Example Title Template:

```
{{id}} - {{title}}
```

This would create a note with the title: `123 - Sample Item`

#### Example Body Template:

```
---
tag: api_import
source_id: {{id}}
created: {{created_at}}
---

# {{title}}

{{description}}
```

### Manual Triggering

You can manually trigger the data fetching and note creation process using the command palette:

1. Press `Ctrl+P` (or `Cmd+P` on Mac) to open the command palette
2. Search for "API Note Importer: Fetch data and create notes"
3. Select the command to trigger the process

## Security Considerations

- API keys and authentication tokens are stored in plain text in the plugin settings
- Be cautious when using APIs that require sensitive authentication information

## Troubleshooting

If you encounter issues:

1. Check the console for error messages (Ctrl+Shift+I or Cmd+Option+I on Mac)
2. Verify your API URL and authentication details
3. Ensure your templates use field names that exist in the API response
4. Check that the target folder exists and is writable

## License

This plugin is licensed under the MIT License. See the LICENSE file for details.