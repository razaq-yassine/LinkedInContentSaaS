"""
Logging configuration for the application
Provides structured logging with file rotation and different log levels
"""
import logging
import logging.handlers
import os
from pathlib import Path
from datetime import datetime
import json

# Create logs directory if it doesn't exist
LOGS_DIR = Path(__file__).parent.parent / "logs"
LOGS_DIR.mkdir(exist_ok=True)

# Log file paths
APP_LOG_FILE = LOGS_DIR / "app.log"
ERROR_LOG_FILE = LOGS_DIR / "error.log"
ACCESS_LOG_FILE = LOGS_DIR / "access.log"
CREDIT_LOG_FILE = LOGS_DIR / "credits.log"


class JSONFormatter(logging.Formatter):
    """
    Custom JSON formatter for structured logging
    """
    def format(self, record):
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "action"):
            log_data["action"] = record.action
        if hasattr(record, "credits"):
            log_data["credits"] = record.credits
        if hasattr(record, "ip_address"):
            log_data["ip_address"] = record.ip_address
        
        return json.dumps(log_data)


def setup_logging():
    """
    Configure application logging with file rotation and different levels
    """
    # Root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.INFO)
    
    # Remove existing handlers to avoid duplicates
    root_logger.handlers = []
    
    # Console handler for development (human-readable)
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.INFO)
    console_formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    root_logger.addHandler(console_handler)
    
    # App log file (all logs, JSON format, with rotation)
    app_handler = logging.handlers.RotatingFileHandler(
        APP_LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=5
    )
    app_handler.setLevel(logging.INFO)
    app_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(app_handler)
    
    # Error log file (errors only, JSON format, with rotation)
    error_handler = logging.handlers.RotatingFileHandler(
        ERROR_LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=10
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(JSONFormatter())
    root_logger.addHandler(error_handler)
    
    # Credit transactions log (separate file for audit trail)
    credit_logger = logging.getLogger("credits")
    credit_handler = logging.handlers.RotatingFileHandler(
        CREDIT_LOG_FILE,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=20  # Keep more history for credits
    )
    credit_handler.setLevel(logging.INFO)
    credit_handler.setFormatter(JSONFormatter())
    credit_logger.addHandler(credit_handler)
    credit_logger.propagate = True  # Also log to root
    
    # Suppress noisy loggers
    logging.getLogger("urllib3").setLevel(logging.WARNING)
    logging.getLogger("multipart").setLevel(logging.WARNING)
    
    logging.info("Logging configuration initialized")


def get_logger(name: str) -> logging.Logger:
    """
    Get a logger with the specified name
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Configured logger instance
    """
    return logging.getLogger(name)


# Credit transaction logger
def log_credit_transaction(
    user_id: str,
    action: str,
    credits_before: float,
    credits_after: float,
    credits_changed: float,
    description: str = None
):
    """
    Log a credit transaction with structured data
    
    Args:
        user_id: User ID
        action: Action type (e.g., 'deduct', 'grant', 'reset')
        credits_before: Credits before transaction
        credits_after: Credits after transaction
        credits_changed: Amount of credits changed (positive or negative)
        description: Optional description
    """
    logger = logging.getLogger("credits")
    logger.info(
        f"Credit transaction: {action} for user {user_id}",
        extra={
            "user_id": user_id,
            "action": action,
            "credits": {
                "before": credits_before,
                "after": credits_after,
                "changed": credits_changed
            },
            "description": description
        }
    )


# Request/response logger
def log_api_request(
    method: str,
    path: str,
    user_id: str = None,
    ip_address: str = None,
    status_code: int = None,
    response_time_ms: float = None
):
    """
    Log an API request with structured data
    
    Args:
        method: HTTP method
        path: Request path
        user_id: User ID (if authenticated)
        ip_address: Client IP address
        status_code: Response status code
        response_time_ms: Response time in milliseconds
    """
    logger = logging.getLogger("api")
    logger.info(
        f"{method} {path} - {status_code}",
        extra={
            "method": method,
            "path": path,
            "user_id": user_id,
            "ip_address": ip_address,
            "status_code": status_code,
            "response_time_ms": response_time_ms
        }
    )

