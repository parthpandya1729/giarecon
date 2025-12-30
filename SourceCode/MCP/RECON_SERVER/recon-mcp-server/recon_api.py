"""
Recon API Client module.

This module provides a Python client for interacting with the Benow Recon API.
It handles authentication, file uploads, field mapping configuration,
reconciliation execution, status monitoring, and result downloads.
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import requests
from pathlib import Path

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('recon_mcp.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class ReconAPIClient:
    """
    Client for interacting with the Benow Recon API.

    This client handles:
    - JWT authentication with token management
    - File uploads (multipart/form-data)
    - Field mapping configuration
    - Reconciliation execution
    - Status monitoring
    - Result downloads

    Example:
        >>> client = ReconAPIClient("https://recon.benow.in/api/recon")
        >>> auth_result = client.authenticate("user@example.com", "password")
        >>> if auth_result["success"]:
        ...     upload_result = client.upload_files("file1.xlsx", "file2.xlsx", "config1")
    """

    def __init__(self, base_url: str):
        """
        Initialize the Recon API client.

        Args:
            base_url: Base URL of the Recon API (e.g., "https://recon.benow.in/api/recon")
        """
        self.base_url = base_url.rstrip('/')
        self.token: Optional[str] = None
        self.token_expiration: Optional[datetime] = None
        logger.info(f"Initialized ReconAPIClient with base URL: {self.base_url}")

    def _is_token_valid(self) -> bool:
        """
        Check if the current authentication token is valid.

        Returns:
            bool: True if token exists and has not expired, False otherwise
        """
        if not self.token or not self.token_expiration:
            return False

        if datetime.now() >= self.token_expiration:
            logger.info("Token has expired")
            return False

        return True

    def authenticate(self, username: str, password: str) -> Dict[str, Any]:
        """
        Authenticate with the Recon API and obtain JWT token.

        CRITICAL: This endpoint uses application/x-www-form-urlencoded format,
        NOT JSON. The token is valid for 1 hour.

        Args:
            username: Email or username for authentication
            password: Password for authentication

        Returns:
            dict: Authentication result with structure:
                {
                    "success": bool,
                    "access_token": str (if success),
                    "token_type": str (if success),
                    "expires_in": int (if success),
                    "error": str (if not success)
                }

        Example:
            >>> result = client.authenticate("user@example.com", "password123")
            >>> if result["success"]:
            ...     print(f"Authenticated! Token expires in {result['expires_in']} seconds")
        """
        url = f"{self.base_url}/auth/login"

        headers = {
            "Content-Type": "application/x-www-form-urlencoded"
        }

        data = {
            "username": username,
            "password": password
        }

        try:
            logger.info(f"Attempting authentication for user: {username}")
            response = requests.post(url, data=data, headers=headers, timeout=30)

            if response.status_code == 200:
                result = response.json()
                self.token = result.get("access_token")
                expires_in = result.get("expires_in", 3600)

                self.token_expiration = datetime.now() + timedelta(seconds=expires_in - 60)

                logger.info(f"Authentication successful. Token expires in {expires_in} seconds")

                return {
                    "success": True,
                    "access_token": self.token,
                    "token_type": result.get("token_type", "Bearer"),
                    "expires_in": expires_in
                }
            else:
                error_msg = f"Authentication failed with status {response.status_code}"
                logger.error(error_msg)

                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text

                return {
                    "success": False,
                    "error": error_msg,
                    "detail": error_detail
                }

        except requests.exceptions.RequestException as e:
            error_msg = f"Network error during authentication: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }

    def _get_auth_headers(self) -> Dict[str, str]:
        """
        Get headers with authentication token.

        Returns:
            dict: Headers dictionary with Authorization header

        Raises:
            ValueError: If token is not set or has expired
        """
        if not self._is_token_valid():
            raise ValueError("No valid authentication token. Please authenticate first.")

        return {
            "Authorization": f"Bearer {self.token}"
        }

    def upload_files(
        self,
        file1_path: str,
        file2_path: str,
        config_name: str
    ) -> Dict[str, Any]:
        """
        Upload two Excel files to create a reconciliation workspace.

        Args:
            file1_path: Path to first Excel file
            file2_path: Path to second Excel file
            config_name: Name for the reconciliation configuration

        Returns:
            dict: Upload result with structure:
                {
                    "success": bool,
                    "workspace_id": str (if success),
                    "config_id": str (if success),
                    "message": str,
                    "error": str (if not success)
                }

        Example:
            >>> result = client.upload_files(
            ...     "samsung_data.xlsx",
            ...     "bank_data.xlsx",
            ...     "Samsung_Dec_2025"
            ... )
            >>> if result["success"]:
            ...     print(f"Workspace ID: {result['workspace_id']}")
            ...     print(f"Config ID: {result['config_id']}")
        """
        url = f"{self.base_url}/workspaces/upload"

        if not os.path.exists(file1_path):
            return {
                "success": False,
                "error": f"File not found: {file1_path}"
            }

        if not os.path.exists(file2_path):
            return {
                "success": False,
                "error": f"File not found: {file2_path}"
            }

        try:
            headers = self._get_auth_headers()

            with open(file1_path, 'rb') as f1, open(file2_path, 'rb') as f2:
                files = {
                    'file1': (os.path.basename(file1_path), f1, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                    'file2': (os.path.basename(file2_path), f2, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                }

                data = {
                    'config_name': config_name
                }

                logger.info(f"Uploading files: {file1_path}, {file2_path}")
                response = requests.post(
                    url,
                    headers=headers,
                    files=files,
                    data=data,
                    timeout=120
                )

            if response.status_code in [200, 201]:
                result = response.json()
                logger.info(f"Files uploaded successfully. Workspace ID: {result.get('workspace_id')}")

                return {
                    "success": True,
                    "workspace_id": result.get("workspace_id"),
                    "config_id": result.get("config_id"),
                    "message": result.get("message", "Files uploaded successfully")
                }
            else:
                error_msg = f"Upload failed with status {response.status_code}"
                logger.error(error_msg)

                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text

                return {
                    "success": False,
                    "error": error_msg,
                    "detail": error_detail
                }

        except ValueError as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error during upload: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }

    def set_field_mapping(
        self,
        workspace_id: str,
        config_id: str,
        mappings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Configure field mappings for reconciliation.

        Args:
            workspace_id: Workspace identifier from upload
            config_id: Configuration identifier from upload
            mappings: Field mapping dictionary with structure:
                {
                    "mappings": [
                        {
                            "file1_column": str,
                            "file2_column": str,
                            "is_primary_key": bool
                        },
                        ...
                    ]
                }

        Returns:
            dict: Mapping result with structure:
                {
                    "success": bool,
                    "message": str,
                    "error": str (if not success)
                }

        Example:
            >>> from config import get_field_mapping_template
            >>> mappings = get_field_mapping_template("samsung")
            >>> result = client.set_field_mapping(workspace_id, config_id, mappings)
        """
        url = f"{self.base_url}/field-mapping/{workspace_id}/{config_id}"

        try:
            headers = self._get_auth_headers()
            headers["Content-Type"] = "application/json"

            logger.info(f"Setting field mappings for workspace {workspace_id}, config {config_id}")
            response = requests.post(
                url,
                headers=headers,
                json=mappings,
                timeout=30
            )

            if response.status_code in [200, 201]:
                result = response.json()
                logger.info("Field mappings configured successfully")

                return {
                    "success": True,
                    "message": result.get("message", "Field mappings configured successfully")
                }
            else:
                error_msg = f"Field mapping failed with status {response.status_code}"
                logger.error(error_msg)

                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text

                return {
                    "success": False,
                    "error": error_msg,
                    "detail": error_detail
                }

        except ValueError as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error during field mapping: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }

    def run_reconciliation(
        self,
        config_id: str,
        file1_path: str,
        file2_path: str
    ) -> Dict[str, Any]:
        """
        Execute reconciliation with auto-recon endpoint.

        Note: This endpoint uploads files again, not just using the config.

        Args:
            config_id: Configuration identifier
            file1_path: Path to first Excel file
            file2_path: Path to second Excel file

        Returns:
            dict: Reconciliation result with structure:
                {
                    "success": bool,
                    "workspace_id": str (if success),
                    "message": str,
                    "error": str (if not success)
                }

        Example:
            >>> result = client.run_reconciliation(
            ...     config_id,
            ...     "samsung_data.xlsx",
            ...     "bank_data.xlsx"
            ... )
            >>> if result["success"]:
            ...     workspace_id = result["workspace_id"]
            ...     # Monitor status with check_status(workspace_id)
        """
        url = f"{self.base_url}/auto-recon/{config_id}"

        if not os.path.exists(file1_path):
            return {
                "success": False,
                "error": f"File not found: {file1_path}"
            }

        if not os.path.exists(file2_path):
            return {
                "success": False,
                "error": f"File not found: {file2_path}"
            }

        try:
            headers = self._get_auth_headers()

            with open(file1_path, 'rb') as f1, open(file2_path, 'rb') as f2:
                files = {
                    'file1': (os.path.basename(file1_path), f1, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'),
                    'file2': (os.path.basename(file2_path), f2, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
                }

                logger.info(f"Running reconciliation with config {config_id}")
                response = requests.post(
                    url,
                    headers=headers,
                    files=files,
                    timeout=120
                )

            if response.status_code in [200, 201]:
                result = response.json()
                logger.info(f"Reconciliation started. Workspace ID: {result.get('workspace_id')}")

                return {
                    "success": True,
                    "workspace_id": result.get("workspace_id"),
                    "message": result.get("message", "Reconciliation started successfully")
                }
            else:
                error_msg = f"Reconciliation failed with status {response.status_code}"
                logger.error(error_msg)

                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text

                return {
                    "success": False,
                    "error": error_msg,
                    "detail": error_detail
                }

        except ValueError as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error during reconciliation: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }

    def check_status(self, workspace_id: str) -> Dict[str, Any]:
        """
        Check the status of a reconciliation operation.

        Args:
            workspace_id: Workspace identifier

        Returns:
            dict: Status result with structure:
                {
                    "success": bool,
                    "status": str ("running"|"completed"|"failed"),
                    "progress": int (0-100),
                    "message": str (if available),
                    "error": str (if not success)
                }

        Example:
            >>> result = client.check_status(workspace_id)
            >>> if result["success"]:
            ...     print(f"Status: {result['status']}")
            ...     print(f"Progress: {result['progress']}%")
        """
        url = f"{self.base_url}/workspaces/{workspace_id}/status"

        try:
            headers = self._get_auth_headers()

            logger.info(f"Checking status for workspace {workspace_id}")
            response = requests.get(url, headers=headers, timeout=30)

            if response.status_code == 200:
                result = response.json()
                status = result.get("status", "unknown")
                progress = result.get("progress", 0)

                logger.info(f"Status: {status}, Progress: {progress}%")

                return {
                    "success": True,
                    "status": status,
                    "progress": progress,
                    "message": result.get("message", "")
                }
            else:
                error_msg = f"Status check failed with status {response.status_code}"
                logger.error(error_msg)

                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text

                return {
                    "success": False,
                    "error": error_msg,
                    "detail": error_detail
                }

        except ValueError as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error during status check: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }

    def download_results(
        self,
        workspace_id: str,
        output_path: str
    ) -> Dict[str, Any]:
        """
        Download reconciliation results as Excel file.

        Args:
            workspace_id: Workspace identifier
            output_path: Path where to save the results Excel file

        Returns:
            dict: Download result with structure:
                {
                    "success": bool,
                    "file_path": str (if success),
                    "file_size": int (if success),
                    "error": str (if not success)
                }

        Example:
            >>> result = client.download_results(
            ...     workspace_id,
            ...     "results/samsung_dec_2025_results.xlsx"
            ... )
            >>> if result["success"]:
            ...     print(f"Results saved to: {result['file_path']}")
            ...     print(f"File size: {result['file_size']} bytes")
        """
        url = f"{self.base_url}/workspaces/{workspace_id}/download"

        try:
            headers = self._get_auth_headers()

            output_dir = os.path.dirname(output_path)
            if output_dir and not os.path.exists(output_dir):
                os.makedirs(output_dir, exist_ok=True)

            logger.info(f"Downloading results for workspace {workspace_id}")
            response = requests.get(url, headers=headers, stream=True, timeout=120)

            if response.status_code == 200:
                with open(output_path, 'wb') as f:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)

                file_size = os.path.getsize(output_path)
                logger.info(f"Results downloaded successfully. File size: {file_size} bytes")

                return {
                    "success": True,
                    "file_path": os.path.abspath(output_path),
                    "file_size": file_size
                }
            else:
                error_msg = f"Download failed with status {response.status_code}"
                logger.error(error_msg)

                try:
                    error_detail = response.json()
                except:
                    error_detail = response.text

                return {
                    "success": False,
                    "error": error_msg,
                    "detail": error_detail
                }

        except ValueError as e:
            logger.error(f"Authentication error: {str(e)}")
            return {
                "success": False,
                "error": str(e)
            }
        except requests.exceptions.RequestException as e:
            error_msg = f"Network error during download: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }
        except IOError as e:
            error_msg = f"File I/O error: {str(e)}"
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg
            }
