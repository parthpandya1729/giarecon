"""
Configuration module for Recon MCP Server.

This module loads environment variables and provides configuration
templates for field mappings used in reconciliation operations.
"""

import os
from typing import Dict, Any, List
from dotenv import load_dotenv

load_dotenv()

API_BASE_URL = os.getenv("RECON_API_BASE_URL", "https://recon.benow.in/api/recon")
USERNAME = os.getenv("RECON_USERNAME", "")
PASSWORD = os.getenv("RECON_PASSWORD", "")
DEBUG = os.getenv("DEBUG", "false").lower() == "true"

SAMSUNG_FIELD_MAPPINGS = {
    "mappings": [
        {
            "file1_column": "txn_ref_number",
            "file2_column": "Transaction Reference",
            "is_primary_key": True
        },
        {
            "file1_column": "TRANSACTIONAMOUNT",
            "file2_column": "Paid Amount",
            "is_primary_key": False
        },
        {
            "file1_column": "product_amount",
            "file2_column": "MRP",
            "is_primary_key": False
        },
        {
            "file1_column": "PRODUCT_CATEGORY",
            "file2_column": "PRODUCT_CATEGORY",
            "is_primary_key": False
        },
        {
            "file1_column": "Tenure",
            "file2_column": "Tenure",
            "is_primary_key": False
        },
        {
            "file1_column": "RATE_OF_INTEREST____P_A_",
            "file2_column": "RATE_OF_INTEREST____P_A_",
            "is_primary_key": False
        },
        {
            "file1_column": "EMI_AMOUNT",
            "file2_column": "EMI_AMOUNT",
            "is_primary_key": False
        },
        {
            "file1_column": "LOAN_AMOUNT",
            "file2_column": "LOAN_AMOUNT",
            "is_primary_key": False
        },
        {
            "file1_column": "Brand share",
            "file2_column": "Correct brand share",
            "is_primary_key": False
        },
        {
            "file1_column": "Bank share",
            "file2_column": "Correct bank share",
            "is_primary_key": False
        }
    ]
}


def validate_config() -> Dict[str, Any]:
    """
    Validate the configuration settings.

    Returns:
        dict: Validation result with status, errors, and warnings

    Example:
        >>> result = validate_config()
        >>> if not result["valid"]:
        ...     print(f"Errors: {result['errors']}")
    """
    errors = []
    warnings = []

    if not API_BASE_URL:
        errors.append("RECON_API_BASE_URL is not set")
    elif not API_BASE_URL.startswith(("http://", "https://")):
        errors.append("RECON_API_BASE_URL must start with http:// or https://")

    if not USERNAME:
        warnings.append("RECON_USERNAME is not set - authentication will require credentials at runtime")

    if not PASSWORD:
        warnings.append("RECON_PASSWORD is not set - authentication will require credentials at runtime")

    if not os.path.exists(".env") and (not USERNAME or not PASSWORD):
        warnings.append(".env file not found - consider copying .env.example and configuring credentials")

    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "config": {
            "api_base_url": API_BASE_URL,
            "username_set": bool(USERNAME),
            "password_set": bool(PASSWORD),
            "debug_mode": DEBUG
        }
    }


def get_field_mapping_template(template_name: str = "samsung") -> Dict[str, Any]:
    """
    Get a predefined field mapping template.

    Args:
        template_name: Name of the template to retrieve (default: "samsung")

    Returns:
        dict: Field mapping template with mappings array

    Raises:
        ValueError: If template_name is not recognized

    Example:
        >>> template = get_field_mapping_template("samsung")
        >>> len(template["mappings"])
        10
        >>> template["mappings"][0]["is_primary_key"]
        True
    """
    templates = {
        "samsung": SAMSUNG_FIELD_MAPPINGS
    }

    if template_name.lower() not in templates:
        raise ValueError(
            f"Unknown template: {template_name}. "
            f"Available templates: {', '.join(templates.keys())}"
        )

    return templates[template_name.lower()].copy()


def get_primary_key_mapping(template_name: str = "samsung") -> Dict[str, str]:
    """
    Extract the primary key mapping from a template.

    Args:
        template_name: Name of the template (default: "samsung")

    Returns:
        dict: Primary key mapping with file1_column and file2_column

    Example:
        >>> pk = get_primary_key_mapping("samsung")
        >>> pk["file1_column"]
        'txn_ref_number'
        >>> pk["file2_column"]
        'Transaction Reference'
    """
    template = get_field_mapping_template(template_name)

    for mapping in template["mappings"]:
        if mapping.get("is_primary_key"):
            return {
                "file1_column": mapping["file1_column"],
                "file2_column": mapping["file2_column"]
            }

    return {}


def print_config_status():
    """
    Print the current configuration status to console.

    This is useful for startup diagnostics and debugging.
    """
    result = validate_config()

    print("=" * 60)
    print("Recon MCP Server - Configuration Status")
    print("=" * 60)

    if result["valid"]:
        print("Status: VALID")
    else:
        print("Status: INVALID")

    print(f"\nAPI Base URL: {result['config']['api_base_url']}")
    print(f"Username Set: {result['config']['username_set']}")
    print(f"Password Set: {result['config']['password_set']}")
    print(f"Debug Mode: {result['config']['debug_mode']}")

    if result["errors"]:
        print("\nERRORS:")
        for error in result["errors"]:
            print(f"  - {error}")

    if result["warnings"]:
        print("\nWARNINGS:")
        for warning in result["warnings"]:
            print(f"  - {warning}")

    print("=" * 60)
