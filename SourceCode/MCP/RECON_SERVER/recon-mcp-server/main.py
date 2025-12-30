"""
Recon MCP Server - Main entry point.

This module implements a Model Context Protocol (MCP) server that provides
tools for AI assistants to interact with the Benow Recon API for automated
reconciliation operations.
"""

from typing import Dict, Any, Optional
from mcp.server.fastmcp import FastMCP

from recon_api import ReconAPIClient
from config import (
    get_field_mapping_template,
    validate_config,
    print_config_status,
    API_BASE_URL,
    USERNAME,
    PASSWORD
)

mcp = FastMCP("recon")

api_client = ReconAPIClient(API_BASE_URL)


@mcp.tool()
def authenticate(username: str, password: str) -> Dict[str, Any]:
    """
    Authenticate with the Benow Recon API and obtain JWT token.

    This tool must be called first before using any other tools. The token
    is valid for 1 hour and will be automatically used for subsequent API calls.

    Args:
        username: Email or username for authentication
        password: Password for authentication

    Returns:
        dict: Authentication result with fields:
            - success (bool): Whether authentication was successful
            - access_token (str): JWT token (if successful)
            - token_type (str): Token type, typically "Bearer"
            - expires_in (int): Token expiration time in seconds
            - error (str): Error message (if unsuccessful)

    Example:
        >>> result = authenticate("user@example.com", "password123")
        >>> if result["success"]:
        ...     print("Authentication successful!")
        ... else:
        ...     print(f"Error: {result['error']}")

    Note:
        - Token expires after 1 hour
        - You will need to re-authenticate after expiration
        - The token is automatically used for subsequent API calls
    """
    return api_client.authenticate(username, password)


@mcp.tool()
def upload_files(
    file1_path: str,
    file2_path: str,
    config_name: str
) -> Dict[str, Any]:
    """
    Upload two Excel files to create a reconciliation workspace.

    This is the first step in the reconciliation workflow after authentication.
    It uploads both files and creates a workspace with configuration for
    further operations.

    Args:
        file1_path: Absolute path to first Excel file
        file2_path: Absolute path to second Excel file
        config_name: Name for the reconciliation configuration (e.g., "Samsung_Dec_2025")

    Returns:
        dict: Upload result with fields:
            - success (bool): Whether upload was successful
            - workspace_id (str): Workspace identifier for status checks and downloads
            - config_id (str): Configuration identifier for mapping and reconciliation
            - message (str): Success message
            - error (str): Error message (if unsuccessful)

    Example:
        >>> result = upload_files(
        ...     "C:/data/samsung_data.xlsx",
        ...     "C:/data/bank_data.xlsx",
        ...     "Samsung_Dec_2025"
        ... )
        >>> if result["success"]:
        ...     workspace_id = result["workspace_id"]
        ...     config_id = result["config_id"]
        ...     print(f"Files uploaded! Workspace: {workspace_id}")

    Note:
        - Both files must exist at the specified paths
        - Files must be in Excel format (.xlsx)
        - You must be authenticated before calling this tool
        - Save the workspace_id and config_id for subsequent operations
    """
    return api_client.upload_files(file1_path, file2_path, config_name)


@mcp.tool()
def set_field_mapping(
    workspace_id: str,
    config_id: str,
    use_samsung_template: bool = True,
    custom_mappings: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Configure field mappings between the two uploaded Excel files.

    Field mappings define how columns from file1 correspond to columns in file2
    for reconciliation. The Samsung template is pre-configured with 10 field
    mappings including the primary key (txn_ref_number <-> Transaction Reference).

    Args:
        workspace_id: Workspace identifier from upload_files
        config_id: Configuration identifier from upload_files
        use_samsung_template: Use predefined Samsung template (default: True)
        custom_mappings: Custom mapping dictionary (only used if use_samsung_template is False)
            Structure: {
                "mappings": [
                    {
                        "file1_column": "column_name_in_file1",
                        "file2_column": "column_name_in_file2",
                        "is_primary_key": true/false
                    },
                    ...
                ]
            }

    Returns:
        dict: Mapping result with fields:
            - success (bool): Whether mapping was successful
            - message (str): Success message
            - error (str): Error message (if unsuccessful)

    Example:
        >>> # Using Samsung template (recommended)
        >>> result = set_field_mapping(workspace_id, config_id)
        >>> if result["success"]:
        ...     print("Mappings configured with Samsung template!")

        >>> # Using custom mappings
        >>> custom = {
        ...     "mappings": [
        ...         {"file1_column": "id", "file2_column": "reference", "is_primary_key": True},
        ...         {"file1_column": "amount", "file2_column": "total", "is_primary_key": False}
        ...     ]
        ... }
        >>> result = set_field_mapping(workspace_id, config_id, False, custom)

    Note:
        - You must call upload_files first to get workspace_id and config_id
        - Samsung template includes 10 field mappings
        - Primary key is required for matching records between files
        - You must be authenticated before calling this tool
    """
    if use_samsung_template:
        mappings = get_field_mapping_template("samsung")
    else:
        if custom_mappings is None:
            return {
                "success": False,
                "error": "custom_mappings must be provided when use_samsung_template is False"
            }
        mappings = custom_mappings

    return api_client.set_field_mapping(workspace_id, config_id, mappings)


@mcp.tool()
def run_reconciliation(
    config_id: str,
    file1_path: str,
    file2_path: str
) -> Dict[str, Any]:
    """
    Execute reconciliation using the configured field mappings.

    This tool runs the actual reconciliation process comparing the two files
    based on the field mappings. The operation is asynchronous - use
    check_reconciliation_status to monitor progress.

    Args:
        config_id: Configuration identifier from upload_files
        file1_path: Absolute path to first Excel file (same as in upload_files)
        file2_path: Absolute path to second Excel file (same as in upload_files)

    Returns:
        dict: Reconciliation result with fields:
            - success (bool): Whether reconciliation started successfully
            - workspace_id (str): Workspace identifier for monitoring status
            - message (str): Success message
            - error (str): Error message (if unsuccessful)

    Example:
        >>> result = run_reconciliation(
        ...     config_id,
        ...     "C:/data/samsung_data.xlsx",
        ...     "C:/data/bank_data.xlsx"
        ... )
        >>> if result["success"]:
        ...     workspace_id = result["workspace_id"]
        ...     print("Reconciliation started!")
        ...     # Now monitor with check_reconciliation_status(workspace_id)

    Note:
        - You must call upload_files and set_field_mapping first
        - Both files must exist at the specified paths
        - The operation is asynchronous - it returns immediately
        - Use check_reconciliation_status to monitor progress
        - You must be authenticated before calling this tool
    """
    return api_client.run_reconciliation(config_id, file1_path, file2_path)


@mcp.tool()
def check_reconciliation_status(workspace_id: str) -> Dict[str, Any]:
    """
    Check the status and progress of a reconciliation operation.

    This tool allows you to monitor a running reconciliation. Call it periodically
    to track progress until status becomes "completed" or "failed".

    Args:
        workspace_id: Workspace identifier from upload_files or run_reconciliation

    Returns:
        dict: Status result with fields:
            - success (bool): Whether status check was successful
            - status (str): Current status ("running", "completed", or "failed")
            - progress (int): Progress percentage (0-100)
            - message (str): Additional status message
            - error (str): Error message (if unsuccessful)

    Example:
        >>> result = check_reconciliation_status(workspace_id)
        >>> if result["success"]:
        ...     status = result["status"]
        ...     progress = result["progress"]
        ...     print(f"Status: {status}, Progress: {progress}%")
        ...
        ...     if status == "completed":
        ...         print("Reconciliation complete! Ready to download results.")
        ...     elif status == "failed":
        ...         print("Reconciliation failed!")
        ...     else:
        ...         print("Still processing...")

    Note:
        - Call this periodically to monitor progress (e.g., every 5-10 seconds)
        - When status is "completed", you can call download_results
        - You must be authenticated before calling this tool
    """
    return api_client.check_status(workspace_id)


@mcp.tool()
def download_results(
    workspace_id: str,
    output_path: str
) -> Dict[str, Any]:
    """
    Download reconciliation results as an Excel file.

    This is the final step in the reconciliation workflow. Call this after
    check_reconciliation_status returns status "completed".

    Args:
        workspace_id: Workspace identifier from upload_files or run_reconciliation
        output_path: Absolute path where to save the results Excel file
            (e.g., "C:/results/samsung_dec_2025_results.xlsx")

    Returns:
        dict: Download result with fields:
            - success (bool): Whether download was successful
            - file_path (str): Absolute path to the downloaded file
            - file_size (int): File size in bytes
            - error (str): Error message (if unsuccessful)

    Example:
        >>> result = download_results(
        ...     workspace_id,
        ...     "C:/results/samsung_dec_2025_results.xlsx"
        ... )
        >>> if result["success"]:
        ...     print(f"Results saved to: {result['file_path']}")
        ...     print(f"File size: {result['file_size']} bytes")

    Note:
        - Only call this after reconciliation status is "completed"
        - The directory for output_path will be created if it doesn't exist
        - The results file contains matched, unmatched, and discrepancy data
        - You must be authenticated before calling this tool
    """
    return api_client.download_results(workspace_id, output_path)


if __name__ == "__main__":
    print("\n" + "=" * 70)
    print("Recon MCP Server Starting...")
    print("=" * 70 + "\n")

    config_status = validate_config()
    print_config_status()

    if not config_status["valid"]:
        print("\nWARNING: Configuration has errors. Please fix them before using the server.")
        print("See .env.example for configuration template.\n")

    if config_status["warnings"]:
        print("\nNote: Some warnings were detected, but the server will start.")
        print("You can provide credentials at runtime using the authenticate tool.\n")

    if USERNAME and PASSWORD:
        print("\nAttempting automatic authentication with credentials from .env file...")
        auth_result = api_client.authenticate(USERNAME, PASSWORD)
        if auth_result["success"]:
            print("SUCCESS: Automatic authentication completed!")
            print(f"Token will expire in {auth_result['expires_in']} seconds.\n")
        else:
            print(f"FAILED: Automatic authentication failed: {auth_result.get('error')}")
            print("You will need to authenticate manually using the authenticate tool.\n")

    print("=" * 70)
    print("Starting MCP server on stdio transport...")
    print("Available tools: authenticate, upload_files, set_field_mapping,")
    print("                 run_reconciliation, check_reconciliation_status,")
    print("                 download_results")
    print("=" * 70 + "\n")

    mcp.run(transport='stdio')
