"""xAI Management API client for managing API keys and access control.

This module provides a client for interacting with xAI's Management API to manage API keys,
check model availability, and handle regional endpoints.

Environment Variables:
    XAI_MANAGEMENT_KEY: Required. Your xAI Management API key
    XAI_TEAM_ID: Required. Your xAI Team ID
    XAI_API_REGION: Optional. Default region for API requests (e.g., 'us-east-1')
"""
import os
import requests
from typing import List, Dict, Optional, Union
from enum import Enum

class XAIRegion(str, Enum):
    """Available xAI API regions."""
    US_EAST_1 = "us-east-1"
    US_WEST_2 = "us-west-2"
    EU_WEST_1 = "eu-west-1"
    AP_SOUTHEAST_1 = "ap-southeast-1"
    AUTO = "api"  # Auto-route to best region

class XAIManagement:
    """Client for xAI Management API operations with regional endpoint support.
    
    This client handles authentication, request signing, and provides methods for all
    xAI Management API operations including API key management and model availability.
    """
    
    def __init__(
        self, 
        management_key: str = None, 
        team_id: str = None,
        region: Union[str, XAIRegion] = None,
        base_url: str = None
    ):
        """Initialize the xAI Management client with configuration.
        
        Args:
            management_key: xAI Management API key. If not provided, will try to get from 
                          XAI_MANAGEMENT_KEY env var.
            team_id: xAI Team ID. If not provided, will try to get from XAI_TEAM_ID env var.
            region: xAI API region (e.g., 'us-east-1'). If not provided, will use XAI_API_REGION 
                   env var or default to auto-routing.
            base_url: Custom base URL for the API. If provided, overrides region-based URL.
        """
        self.management_key = management_key or os.getenv('XAI_MANAGEMENT_KEY')
        self.team_id = team_id or os.getenv('XAI_TEAM_ID')
        
        if not self.management_key:
            raise ValueError(
                "xAI Management API key is required. "
                "Set XAI_MANAGEMENT_KEY environment variable or pass management_key parameter."
            )
            
        if not self.team_id:
            raise ValueError(
                "xAI Team ID is required. "
                "Set XAI_TEAM_ID environment variable or pass team_id parameter."
            )
        
        # Configure base URL
        if base_url:
            self.base_url = base_url.rstrip('/')
        else:
            region = region or os.getenv('XAI_API_REGION', XAIRegion.AUTO)
            region = XAIRegion(region) if isinstance(region, str) else region
            self.base_url = f"https://{region.value}.api.x.ai"
        
        self.headers = {
            "Authorization": f"Bearer {self.management_key}",
            "Content-Type": "application/json",
            "X-Team-ID": self.team_id
        }
    
    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict:
        """Make an HTTP request to the xAI Management API.
        
        Args:
            method: HTTP method (GET, POST, PUT, DELETE, etc.)
            endpoint: API endpoint path (e.g., '/auth/teams/{teamId}/api-keys')
            **kwargs: Additional arguments to pass to requests.request()
            
        Returns:
            Parsed JSON response as a dictionary
            
        Raises:
            requests.HTTPError: If the API returns an error status code
            ValueError: If the response cannot be parsed as JSON
        """
        # Ensure endpoint starts with a slash
        if not endpoint.startswith('/'):
            endpoint = f'/{endpoint}'
            
        url = f"{self.base_url}{endpoint}"
        
        try:
            response = requests.request(
                method=method.upper(),
                url=url,
                headers=self.headers,
                timeout=30,  # 30 second timeout by default
                **kwargs
            )
            response.raise_for_status()
            
            # Handle empty responses (e.g., 204 No Content)
            if not response.content:
                return {}
                
            return response.json()
            
        except requests.exceptions.RequestException as e:
            # Provide more detailed error information
            error_msg = f"API request failed: {str(e)}"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_data = e.response.json()
                    error_msg = f"{error_msg} - {error_data.get('error', {}).get('message', '')}"
                except ValueError:
                    error_msg = f"{error_msg} - {e.response.text}"
            raise requests.exceptions.RequestException(error_msg) from e
    
    def create_api_key(
        self,
        name: str,
        acls: List[str] = None,
        qps: int = 5,
        qpm: int = 100,
        tpm: Optional[int] = None
    ) -> Dict:
        """Create a new API key with the specified permissions.
        
        Args:
            name: A name for the API key
            acls: List of ACL strings (e.g., ["api-key:model:*", "api-key:endpoint:*"])
            qps: Queries per second limit
            qpm: Queries per minute limit
            tpm: Tokens per minute limit (optional)
            
        Returns:
            Dict containing the API key details including the actual key
        """
        if acls is None:
            acls = ["api-key:model:*", "api-key:endpoint:*"]
            
        data = {
            "name": name,
            "acls": acls,
            "qps": qps,
            "qpm": qpm,
        }
        
        if tpm is not None:
            data["tpm"] = str(tpm)
        
        return self._make_request(
            "POST",
            f"/auth/teams/{self.team_id}/api-keys",
            json=data
        )
    
    def list_api_keys(self, page_size: int = 10, pagination_token: str = "") -> Dict:
        """List all API keys for the team.
        
        Args:
            page_size: Number of results per page
            pagination_token: Token for pagination
            
        Returns:
            Dictionary containing the list of API keys and pagination info
        """
        return self._make_request(
            "GET",
            f"/auth/teams/{self.team_id}/api-keys?pageSize={page_size}&paginationToken={pagination_token}"
        )
    
    def update_api_key(
        self,
        api_key_id: str,
        updates: Dict,
        fields: List[str]
    ) -> Dict:
        """Update an existing API key.
        
        Args:
            api_key_id: The ID of the API key to update
            updates: Dictionary with fields to update (e.g., {"qpm": 200})
            fields: List of field names being updated (e.g., ["qpm"])
            
        Returns:
            Updated API key details
        """
        data = {
            "apiKey": {"id": api_key_id, **updates},
            "fieldMask": ",".join(fields)
        }
        
        return self._make_request(
            "PUT",
            f"/auth/teams/{self.team_id}/api-keys",
            json=data
        )
    
    def delete_api_key(self, api_key_id: str) -> bool:
        """Delete an API key.
        
        Args:
            api_key_id: The ID of the API key to delete
            
        Returns:
            True if deletion was successful
        """
        self._make_request(
            "DELETE",
            f"/auth/api-keys/{api_key_id}"
        )
        return True
    
    def check_propagation_status(self, api_key_id: str) -> Dict:
        """Check the propagation status of an API key across clusters.
        
        Args:
            api_key_id: The ID of the API key to check
            
        Returns:
            Dictionary with propagation status information
        """
        return self._make_request(
            "GET",
            f"/auth/api-keys/{api_key_id}/propagation"
        )
    
    def list_available_models(self) -> List[Dict]:
        """List all models available for the team.
        
        Returns:
            List of available models with their details
        """
        return self._make_request(
            "GET",
            f"/auth/teams/{self.team_id}/models"
        )
    
    def list_available_endpoints(self) -> List[str]:
        """List all available endpoint ACLs for the team.
        
        Returns:
            List of available endpoint ACL strings
        """
        return self._make_request(
            "GET",
            f"/auth/teams/{self.team_id}/endpoints"
        )

    def get_available_regions(self) -> Dict[str, List[str]]:
        """Get a list of available regions and their supported models.
        
        Returns:
            Dictionary mapping region names to lists of supported model names
        """
        regions = {}
        current_region = self.base_url.split('//')[-1].split('.')[0]
        
        try:
            # Get models available in the current region
            models = self.list_available_models()
            regions[current_region] = [m.get('id') for m in models.get('models', [])]
            
            # If we're not using auto-routing, try to get models from auto endpoint
            if current_region != XAIRegion.AUTO.value:
                try:
                    auto_client = XAIManagement(
                        management_key=self.management_key,
                        team_id=self.team_id,
                        region=XAIRegion.AUTO
                    )
                    all_models = auto_client.list_available_models()
                    regions['auto'] = [m.get('id') for m in all_models.get('models', [])]
                except Exception:
                    pass
                    
        except Exception as e:
            print(f"Warning: Could not fetch available regions: {str(e)}")
            
        return regions


def get_region_choices() -> List[str]:
    """Get a list of available xAI regions as strings."""
    return [region.value for region in XAIRegion]


# Example usage
if __name__ == "__main__":
    import argparse
    import json
    
    parser = argparse.ArgumentParser(description='xAI Management API CLI')
    parser.add_argument('--region', type=str, default=XAIRegion.AUTO.value,
                       choices=get_region_choices(),
                       help='xAI API region')
    args = parser.parse_args()
    
    try:
        # Initialize client with command line arguments and environment variables
        xai = XAIManagement(region=args.region)
        
        # Example: Show available regions and models
        print("\n=== Available Regions and Models ===")
        regions = xai.get_available_regions()
        for region, models in regions.items():
            print(f"\nRegion: {region}")
            print(f"Models: {', '.join(models[:3])}{'...' if len(models) > 3 else ''}")
        
        # Example: Create a new API key
        print("\n=== Creating New API Key ===")
        new_key = xai.create_api_key(
            name=f"CodedSwitch Production - {args.region}",
            acls=["api-key:model:*", "api-key:endpoint:*"],
            qps=5,
            qpm=100
        )
        print(f"New API Key: {new_key.get('apiKey')}")
        print(f"Key ID: {new_key.get('apiKeyId')}")
        
        # Example: List all API keys
        print("\n=== Current API Keys ===")
        keys = xai.list_api_keys()
        for key in keys.get('apiKeys', [])[:5]:  # Show first 5 keys
            print(f"- {key.get('name')} (ID: {key.get('id')})")
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)
