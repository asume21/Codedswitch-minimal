# xAI Management Tools

This directory contains tools for managing xAI API keys and resources programmatically.

## Prerequisites

1. Python 3.8+
2. Required packages (install with `pip install -r requirements.txt` in the backend directory)
3. xAI Management API key with appropriate permissions
4. xAI Team ID

## Available Scripts

### `manage_xai.py`

A command-line interface for managing xAI API keys and resources.

#### Setup

1. Set environment variables (recommended):
   ```bash
   # Required
   export XAI_MANAGEMENT_KEY=your_management_key_here
   export XAI_TEAM_ID=your_team_id_here
   
   # Optional (defaults to auto-routing)
   export XAI_API_REGION=us-east-1
   ```

2. Or pass them as command-line arguments.

#### Usage

```bash
# Show help
python scripts/manage_xai.py --help

# Create a new API key
python scripts/manage_xai.py create-key --name "My API Key" --all-models --all-endpoints

# List API keys
python scripts/manage_xai.py list-keys

# Delete an API key
python scripts/manage_xai.py delete-key <key_id>

# List available models
python scripts/manage_xai.py list-models

# Show available regions
python scripts/manage_xai.py regions
```

#### Examples

1. Create a key with specific model access:
   ```bash
   python scripts/manage_xai.py create-key \
     --name "Production Key" \
     --model grok-3 \
     --model grok-4-0709 \
     --endpoint chat \
     --qps 10 \
     --qpm 1000
   ```

2. List keys in JSON format:
   ```bash
   python scripts/manage_xai.py list-keys --output json
   ```

### `xai_management.py`

A Python module that provides a client for the xAI Management API. This is used internally by `manage_xai.py` but can also be imported and used in other Python scripts.

#### Example Usage

```python
from xai_management import XAIManagement, XAIRegion

# Initialize client
client = XAIManagement(
    management_key="your_management_key",
    team_id="your_team_id",
    region=XAIRegion.US_EAST_1
)

# Create a new API key
new_key = client.create_api_key(
    name="My App",
    acls=["api-key:model:*", "api-key:endpoint:*"],
    qps=5,
    qpm=100
)
print(f"Created API key: {new_key['apiKey']}")
```

## Error Handling

- All commands return a non-zero exit code on failure
- Error messages are printed to stderr
- Use `--output json` for machine-readable output

## Security Notes

- Never commit your management API key to version control
- Use environment variables for sensitive information
- Rotate API keys regularly
- Follow the principle of least privilege when assigning permissions

## License

This project is licensed under the terms of the MIT license.
