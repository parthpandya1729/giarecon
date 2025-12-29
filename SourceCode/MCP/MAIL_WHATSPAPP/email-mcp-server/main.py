#!/usr/bin/env python3
"""
Email MCP Server - Main entry point
"""

import logging
import os
from typing import Dict, List, Optional

import uvicorn
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from mcp_tools import register_mcp_tools

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Email MCP Server",
    description="Model Context Protocol server for email operations",
    version="0.1.0",
)

# Email Bridge API base URL
EMAIL_BRIDGE_API_URL = os.getenv("EMAIL_BRIDGE_API_URL", "http://localhost:8080")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Email MCP Server is running"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "ok"}


# Register MCP tools
register_mcp_tools(app)


def main():
    """Main entry point"""
    logger.info("Starting Email MCP Server")
    logger.info(f"Using Email Bridge API at {EMAIL_BRIDGE_API_URL}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=bool(os.getenv("DEBUG", "False").lower() == "true"),
    )


if __name__ == "__main__":
    main()