"""
PII (Personally Identifiable Information) Redaction Utility

Detects and redacts sensitive personal information before sending to external LLM APIs.
This helps comply with privacy regulations and reduces data exposure risk.
"""

import re
from typing import Dict, List, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


# PII detection patterns
PII_PATTERNS = {
    # Email addresses
    "email": re.compile(
        r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        re.IGNORECASE
    ),
    
    # Phone numbers (various formats)
    "phone": re.compile(
        r'''
        (?:
            # International format
            \+?[1-9]\d{0,2}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}|
            # US/Canada format
            \(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|
            # General format with area code
            \d{2,4}[-.\s]\d{2,4}[-.\s]\d{2,4}
        )
        ''',
        re.VERBOSE
    ),
    
    # Social Security Numbers (US)
    "ssn": re.compile(
        r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b'
    ),
    
    # Credit card numbers (basic patterns)
    "credit_card": re.compile(
        r'\b(?:4\d{3}|5[1-5]\d{2}|6011|3[47]\d{2})[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b'
    ),
    
    # IP addresses
    "ip_address": re.compile(
        r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b'
    ),
    
    # Passport numbers (generic pattern)
    "passport": re.compile(
        r'\b[A-Z]{1,2}\d{6,9}\b',
        re.IGNORECASE
    ),
    
    # Bank account numbers (generic - IBAN)
    "iban": re.compile(
        r'\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}(?:[A-Z0-9]?){0,16}\b',
        re.IGNORECASE
    ),
    
    # Date of birth patterns
    "dob": re.compile(
        r'''
        (?:
            # MM/DD/YYYY or MM-DD-YYYY
            (?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])[-/](?:19|20)\d{2}|
            # DD/MM/YYYY or DD-MM-YYYY
            (?:0?[1-9]|[12]\d|3[01])[-/](?:0?[1-9]|1[0-2])[-/](?:19|20)\d{2}|
            # YYYY-MM-DD (ISO)
            (?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])
        )
        ''',
        re.VERBOSE
    ),
    
    # Street addresses (simplified - US style)
    "address": re.compile(
        r'\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Circle|Cir|Place|Pl)\.?\b',
        re.IGNORECASE
    ),
    
    # Zip codes (US)
    "zip_code": re.compile(
        r'\b\d{5}(?:-\d{4})?\b'
    ),
}

# Redaction placeholders
REDACTION_PLACEHOLDERS = {
    "email": "[EMAIL_REDACTED]",
    "phone": "[PHONE_REDACTED]",
    "ssn": "[SSN_REDACTED]",
    "credit_card": "[CARD_REDACTED]",
    "ip_address": "[IP_REDACTED]",
    "passport": "[PASSPORT_REDACTED]",
    "iban": "[IBAN_REDACTED]",
    "dob": "[DOB_REDACTED]",
    "address": "[ADDRESS_REDACTED]",
    "zip_code": "[ZIP_REDACTED]",
}


class PIIRedactor:
    """
    Service for detecting and redacting PII from text.
    
    Can be configured to redact specific PII types or preserve certain patterns.
    """
    
    def __init__(
        self,
        redact_types: Optional[List[str]] = None,
        preserve_patterns: Optional[List[str]] = None,
        log_detections: bool = True
    ):
        """
        Initialize the PII redactor.
        
        Args:
            redact_types: List of PII types to redact. None = all types.
            preserve_patterns: Regex patterns to NOT redact (e.g., company domains).
            log_detections: Whether to log when PII is detected.
        """
        self.redact_types = redact_types or list(PII_PATTERNS.keys())
        self.preserve_patterns = [re.compile(p) for p in (preserve_patterns or [])]
        self.log_detections = log_detections
    
    def detect_pii(self, text: str) -> Dict[str, List[str]]:
        """
        Detect PII in text without redacting.
        
        Args:
            text: Text to scan for PII
            
        Returns:
            Dictionary mapping PII type to list of found values
        """
        if not text:
            return {}
        
        detected = {}
        
        for pii_type in self.redact_types:
            pattern = PII_PATTERNS.get(pii_type)
            if not pattern:
                continue
            
            matches = pattern.findall(text)
            if matches:
                # Filter out preserved patterns
                filtered_matches = []
                for match in matches:
                    should_preserve = False
                    for preserve in self.preserve_patterns:
                        if preserve.search(match):
                            should_preserve = True
                            break
                    if not should_preserve:
                        filtered_matches.append(match)
                
                if filtered_matches:
                    detected[pii_type] = filtered_matches
        
        return detected
    
    def redact(self, text: str) -> Tuple[str, Dict[str, int]]:
        """
        Redact PII from text.
        
        Args:
            text: Text containing potential PII
            
        Returns:
            Tuple of (redacted_text, stats_dict)
            stats_dict maps PII type to count of redactions
        """
        if not text:
            return text, {}
        
        redacted = text
        stats = {}
        
        for pii_type in self.redact_types:
            pattern = PII_PATTERNS.get(pii_type)
            placeholder = REDACTION_PLACEHOLDERS.get(pii_type, "[REDACTED]")
            
            if not pattern:
                continue
            
            # Find all matches first
            matches = list(pattern.finditer(redacted))
            count = 0
            
            # Replace from end to start to preserve indices
            for match in reversed(matches):
                matched_text = match.group()
                
                # Check if should be preserved
                should_preserve = False
                for preserve in self.preserve_patterns:
                    if preserve.search(matched_text):
                        should_preserve = True
                        break
                
                if not should_preserve:
                    redacted = redacted[:match.start()] + placeholder + redacted[match.end():]
                    count += 1
            
            if count > 0:
                stats[pii_type] = count
        
        if stats and self.log_detections:
            total = sum(stats.values())
            logger.warning(
                f"PII redacted from content: {stats} (total: {total} items)"
            )
        
        return redacted, stats
    
    def redact_for_llm(
        self,
        text: str,
        context: str = "unknown"
    ) -> str:
        """
        Redact PII specifically for LLM API calls.
        
        Args:
            text: Text to redact
            context: Context description for logging (e.g., "cv_content", "user_message")
            
        Returns:
            Redacted text safe for LLM processing
        """
        redacted, stats = self.redact(text)
        
        if stats:
            logger.info(
                f"PII redaction for LLM ({context}): "
                f"redacted {sum(stats.values())} items across {len(stats)} categories"
            )
        
        return redacted


# Default redactor instance with common LLM-safe settings
_default_redactor: Optional[PIIRedactor] = None


def get_pii_redactor() -> PIIRedactor:
    """Get the default PII redactor instance."""
    global _default_redactor
    if _default_redactor is None:
        # Default: redact high-risk PII types
        _default_redactor = PIIRedactor(
            redact_types=["email", "phone", "ssn", "credit_card", "iban", "passport"],
            log_detections=True
        )
    return _default_redactor


def redact_pii(text: str, context: str = "unknown") -> str:
    """
    Convenience function to redact PII from text.
    
    Args:
        text: Text to redact
        context: Context for logging
        
    Returns:
        Redacted text
    """
    return get_pii_redactor().redact_for_llm(text, context)


def redact_pii_from_dict(
    data: Dict,
    fields_to_redact: List[str],
    context: str = "dict"
) -> Dict:
    """
    Redact PII from specific fields in a dictionary.
    
    Args:
        data: Dictionary containing potential PII
        fields_to_redact: List of field names to check and redact
        context: Context for logging
        
    Returns:
        New dictionary with redacted values
    """
    redactor = get_pii_redactor()
    result = data.copy()
    
    for field in fields_to_redact:
        if field in result and isinstance(result[field], str):
            result[field] = redactor.redact_for_llm(result[field], f"{context}.{field}")
    
    return result


def detect_pii_in_text(text: str) -> bool:
    """
    Check if text contains any PII.
    
    Args:
        text: Text to check
        
    Returns:
        True if PII detected, False otherwise
    """
    detected = get_pii_redactor().detect_pii(text)
    return len(detected) > 0
