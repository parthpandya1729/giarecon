"""
MCP Tools - Implementation of Model Context Protocol tools for email operations
"""

import logging
import os
from typing import Dict, List, Optional, Any, Union

import requests
from fastapi import FastAPI
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

# Email Bridge API base URL
EMAIL_BRIDGE_API_URL = os.getenv("EMAIL_BRIDGE_API_URL", "http://localhost:8080")


class EmailSearchParams(BaseModel):
    """Parameters for searching emails"""
    query: Optional[str] = Field(None, description="Search term to match in email content or subject")
    folder: Optional[str] = Field(None, description="Folder to search in")
    from_address: Optional[str] = Field(None, description="Sender email address")
    to_address: Optional[str] = Field(None, description="Recipient email address")
    subject: Optional[str] = Field(None, description="Email subject")
    after_date: Optional[str] = Field(None, description="Only return emails after this date (ISO-8601 format)")
    before_date: Optional[str] = Field(None, description="Only return emails before this date (ISO-8601 format)")
    has_attachments: Optional[bool] = Field(None, description="Filter by presence of attachments")
    is_read: Optional[bool] = Field(None, description="Filter by read/unread status")
    limit: int = Field(20, description="Maximum number of emails to return")
    offset: int = Field(0, description="Number of emails to skip")


class EmailAddress(BaseModel):
    """Email address with optional name"""
    name: Optional[str] = Field(None, description="Display name")
    email: str = Field(..., description="Email address")


class EmailCompose(BaseModel):
    """Parameters for composing an email"""
    to: List[EmailAddress] = Field(..., description="Recipients")
    cc: Optional[List[EmailAddress]] = Field(None, description="CC recipients")
    bcc: Optional[List[EmailAddress]] = Field(None, description="BCC recipients")
    subject: str = Field(..., description="Email subject")
    text_content: str = Field(..., description="Plain text content")
    html_content: Optional[str] = Field(None, description="HTML content")
    attachment_paths: Optional[List[str]] = Field(None, description="Paths to attachments")


class EmailReply(BaseModel):
    """Parameters for replying to an email"""
    email_id: str = Field(..., description="ID of the email to reply to")
    reply_all: bool = Field(False, description="Whether to reply to all recipients")
    text_content: str = Field(..., description="Plain text content")
    html_content: Optional[str] = Field(None, description="HTML content")
    attachment_paths: Optional[List[str]] = Field(None, description="Paths to attachments")


class EmailForward(BaseModel):
    """Parameters for forwarding an email"""
    email_id: str = Field(..., description="ID of the email to forward")
    to: List[EmailAddress] = Field(..., description="Recipients")
    cc: Optional[List[EmailAddress]] = Field(None, description="CC recipients")
    bcc: Optional[List[EmailAddress]] = Field(None, description="BCC recipients")
    text_content: Optional[str] = Field(None, description="Additional plain text content")
    html_content: Optional[str] = Field(None, description="Additional HTML content")
    attachment_paths: Optional[List[str]] = Field(None, description="Additional attachment paths")


def register_mcp_tools(app: FastAPI) -> None:
    """Register MCP tools with the FastAPI app"""
    
    @app.post("/mcp/search_emails", tags=["MCP Tools"])
    async def mcp_search_emails(params: EmailSearchParams) -> Dict[str, Any]:
        """
        Search emails based on provided criteria
        
        Args:
            params: Search parameters
            
        Returns:
            Dict containing search results
        """
        return search_emails(params)
    
    @app.get("/mcp/get_email/{email_id}", tags=["MCP Tools"])
    async def mcp_get_email(email_id: str) -> Dict[str, Any]:
        """
        Get a specific email by ID
        
        Args:
            email_id: Email ID
            
        Returns:
            Dict containing email details
        """
        return get_email(email_id)
    
    @app.post("/mcp/send_email", tags=["MCP Tools"])
    async def mcp_send_email(params: EmailCompose) -> Dict[str, Any]:
        """
        Compose and send a new email
        
        Args:
            params: Email composition parameters
            
        Returns:
            Dict containing send status
        """
        return send_email(params)
    
    @app.post("/mcp/reply_to_email", tags=["MCP Tools"])
    async def mcp_reply_to_email(params: EmailReply) -> Dict[str, Any]:
        """
        Reply to an existing email
        
        Args:
            params: Reply parameters
            
        Returns:
            Dict containing send status
        """
        return reply_to_email(params)
    
    @app.post("/mcp/forward_email", tags=["MCP Tools"])
    async def mcp_forward_email(params: EmailForward) -> Dict[str, Any]:
        """
        Forward an existing email
        
        Args:
            params: Forward parameters
            
        Returns:
            Dict containing send status
        """
        return forward_email(params)
    
    @app.get("/mcp/list_folders", tags=["MCP Tools"])
    async def mcp_list_folders() -> Dict[str, Any]:
        """
        List available email folders
        
        Returns:
            Dict containing folder list
        """
        return list_folders()
    
    @app.get("/mcp/download_attachment/{attachment_id}", tags=["MCP Tools"])
    async def mcp_download_attachment(attachment_id: str) -> Dict[str, Any]:
        """
        Download an email attachment
        
        Args:
            attachment_id: Attachment ID
            
        Returns:
            Dict containing attachment details and local path
        """
        return download_attachment(attachment_id)


def search_emails(params: EmailSearchParams) -> Dict[str, Any]:
    """
    Search emails based on provided criteria
    
    Args:
        params: Search parameters
        
    Returns:
        Dict containing search results
    """
    try:
        response = requests.get(
            f"{EMAIL_BRIDGE_API_URL}/emails",
            params=params.dict(exclude_none=True)
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error searching emails: {e}")
        return {"error": str(e), "emails": []}


def get_email(email_id: str) -> Dict[str, Any]:
    """
    Get a specific email by ID
    
    Args:
        email_id: Email ID
        
    Returns:
        Dict containing email details
    """
    try:
        response = requests.get(f"{EMAIL_BRIDGE_API_URL}/emails/{email_id}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error getting email: {e}")
        return {"error": str(e), "email": None}


def send_email(params: EmailCompose) -> Dict[str, Any]:
    """
    Compose and send a new email
    
    Args:
        params: Email composition parameters
        
    Returns:
        Dict containing send status
    """
    try:
        response = requests.post(
            f"{EMAIL_BRIDGE_API_URL}/emails",
            json=params.dict(exclude_none=True)
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error sending email: {e}")
        return {"error": str(e), "success": False}


def reply_to_email(params: EmailReply) -> Dict[str, Any]:
    """
    Reply to an existing email
    
    Args:
        params: Reply parameters
        
    Returns:
        Dict containing send status
    """
    try:
        response = requests.post(
            f"{EMAIL_BRIDGE_API_URL}/emails/{params.email_id}/reply",
            json=params.dict(exclude_none=True)
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error replying to email: {e}")
        return {"error": str(e), "success": False}


def forward_email(params: EmailForward) -> Dict[str, Any]:
    """
    Forward an existing email
    
    Args:
        params: Forward parameters
        
    Returns:
        Dict containing send status
    """
    try:
        response = requests.post(
            f"{EMAIL_BRIDGE_API_URL}/emails/{params.email_id}/forward",
            json=params.dict(exclude_none=True)
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error forwarding email: {e}")
        return {"error": str(e), "success": False}


def list_folders() -> Dict[str, Any]:
    """
    List available email folders
    
    Returns:
        Dict containing folder list
    """
    try:
        response = requests.get(f"{EMAIL_BRIDGE_API_URL}/folders")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error listing folders: {e}")
        return {"error": str(e), "folders": []}


def download_attachment(attachment_id: str) -> Dict[str, Any]:
    """
    Download an email attachment
    
    Args:
        attachment_id: Attachment ID
        
    Returns:
        Dict containing attachment details and local path
    """
    try:
        response = requests.get(f"{EMAIL_BRIDGE_API_URL}/attachments/{attachment_id}")
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error downloading attachment: {e}")
        return {"error": str(e), "attachment": None}