#!/usr/bin/env python3
"""
CodedSwitch xAI Management CLI

This script provides a command-line interface for managing xAI API keys and resources.
It handles regional endpoints and provides helpful utilities for working with the xAI API.
"""
import os
import sys
import json
import click
from pathlib import Path
from typing import Optional, List, Dict, Any

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent / 'backend'))
from xai_management import XAIManagement, XAIRegion

# Common options
def common_options(f):
    """Common CLI options for xAI management commands."""
    f = click.option('--region', 
                   type=click.Choice([r.value for r in XAIRegion]),
                   default=XAIRegion.AUTO.value,
                   help='xAI API region')(f)
    f = click.option('--team-id', 
                   envvar='XAI_TEAM_ID',
                   help='xAI Team ID (can also use XAI_TEAM_ID env var)')(f)
    f = click.option('--management-key', 
                   envvar='XAI_MANAGEMENT_KEY',
                   help='xAI Management API Key (can also use XAI_MANAGEMENT_KEY env var)')(f)
    return f

@click.group()
def cli():
    """CodedSwitch xAI Management CLI."""
    pass

@cli.command()
@common_options
@click.option('--name', required=True, help='Name for the new API key')
@click.option('--qps', type=int, default=5, help='Queries per second limit')
@click.option('--qpm', type=int, default=100, help='Queries per minute limit')
@click.option('--tpm', type=int, help='Tokens per minute limit (optional)')
@click.option('--all-models', is_flag=True, help='Allow access to all models')
@click.option('--model', 'models', multiple=True, help='Specific model to allow (can be used multiple times)')
@click.option('--all-endpoints', is_flag=True, help='Allow access to all endpoints')
@click.option('--endpoint', 'endpoints', multiple=True, help='Specific endpoint to allow (e.g., chat, image)')
@click.option('--output', type=click.Choice(['text', 'json']), default='text', help='Output format')
def create_key(region, team_id, management_key, name, qps, qpm, tpm, all_models, models, all_endpoints, endpoints, output):
    """Create a new xAI API key."""
    try:
        # Build ACLs
        acls = []
        
        if all_models:
            acls.append("api-key:model:*")
        else:
            for model in models:
                acls.append(f"api-key:model:{model}")
        
        if all_endpoints:
            acls.append("api-key:endpoint:*")
        else:
            for endpoint in endpoints:
                acls.append(f"api-key:endpoint:{endpoint}")
        
        if not acls:
            click.echo("Error: At least one model or endpoint must be specified", err=True)
            sys.exit(1)
        
        # Create the client and make the request
        client = XAIManagement(
            management_key=management_key,
            team_id=team_id,
            region=region
        )
        
        result = client.create_api_key(
            name=name,
            acls=acls,
            qps=qps,
            qpm=qpm,
            tpm=tpm
        )
        
        if output == 'json':
            click.echo(json.dumps(result, indent=2))
        else:
            click.echo("\n=== New API Key Created ===")
            click.echo(f"Name: {name}")
            click.echo(f"Key: {result.get('apiKey')}")
            click.echo(f"Key ID: {result.get('apiKeyId')}")
            click.echo(f"ACLs: {', '.join(acls)}")
            click.echo(f"QPS: {qps}, QPM: {qpm}" + (f", TPM: {tpm}" if tpm else ""))
    
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)

@cli.command()
@common_options
@click.option('--output', type=click.Choice(['text', 'json']), default='text', help='Output format')
@click.option('--limit', type=int, default=10, help='Maximum number of keys to show')
def list_keys(region, team_id, management_key, output, limit):
    """List all API keys for the team."""
    try:
        client = XAIManagement(
            management_key=management_key,
            team_id=team_id,
            region=region
        )
        
        result = client.list_api_keys()
        keys = result.get('apiKeys', [])[:limit]
        
        if output == 'json':
            click.echo(json.dumps(keys, indent=2))
        else:
            click.echo("\n=== API Keys ===")
            if not keys:
                click.echo("No API keys found.")
            else:
                for key in keys:
                    click.echo(f"\nName: {key.get('name')}")
                    click.echo(f"ID: {key.get('id')}")
                    click.echo(f"Created: {key.get('createdAt')}")
                    click.echo(f"ACLs: {', '.join(key.get('acls', []))}")
                    click.echo(f"Limits: {key.get('qps')} QPS, {key.get('qpm')} QPM" + 
                             (f", {key.get('tpm')} TPM" if key.get('tpm') else ""))
    
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)

@cli.command()
@common_options
@click.argument('key_id')
@click.option('--output', type=click.Choice(['text', 'json']), default='text', help='Output format')
def delete_key(region, team_id, management_key, key_id, output):
    """Delete an API key by ID."""
    try:
        client = XAIManagement(
            management_key=management_key,
            team_id=team_id,
            region=region
        )
        
        success = client.delete_api_key(key_id)
        
        if output == 'json':
            click.echo(json.dumps({"success": success, "keyId": key_id}, indent=2))
        else:
            if success:
                click.echo(f"Successfully deleted API key: {key_id}")
            else:
                click.echo(f"Failed to delete API key: {key_id}", err=True)
                sys.exit(1)
    
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)

@cli.command()
@common_options
@click.option('--output', type=click.Choice(['text', 'json']), default='text', help='Output format')
def list_models(region, team_id, management_key, output):
    """List all available models for the team."""
    try:
        client = XAIManagement(
            management_key=management_key,
            team_id=team_id,
            region=region
        )
        
        result = client.list_available_models()
        models = result.get('models', [])
        
        if output == 'json':
            click.echo(json.dumps(models, indent=2))
        else:
            click.echo("\n=== Available Models ===")
            if not models:
                click.echo("No models found.")
            else:
                for model in models:
                    click.echo(f"\nID: {model.get('id')}")
                    click.echo(f"Name: {model.get('name', 'N/A')}")
                    click.echo(f"Description: {model.get('description', 'N/A')}")
                    click.echo(f"Context Length: {model.get('contextLength', 'N/A')} tokens")
    
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)

@cli.command()
@common_options
@click.option('--output', type=click.Choice(['text', 'json']), default='text', help='Output format')
def regions(region, team_id, management_key, output):
    """Show available regions and their supported models."""
    try:
        client = XAIManagement(
            management_key=management_key,
            team_id=team_id,
            region=region
        )
        
        regions = client.get_available_regions()
        
        if output == 'json':
            click.echo(json.dumps(regions, indent=2))
        else:
            click.echo("\n=== Available Regions ===")
            for region_name, models in regions.items():
                click.echo(f"\nRegion: {region_name}")
                click.echo(f"Models: {', '.join(models[:5])}" + 
                         ("..." if len(models) > 5 else ""))
    
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)

if __name__ == '__main__':
    cli()
