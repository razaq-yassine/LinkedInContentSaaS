"""
Token Encryption Service using Fernet (AES-256)

Provides secure encryption for OAuth tokens and other sensitive data at rest.
Uses Fernet symmetric encryption which provides:
- AES-128-CBC encryption
- HMAC-SHA256 authentication
- Automatic IV generation
"""

import os
import base64
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

logger = logging.getLogger(__name__)


class TokenEncryptionService:
    """
    Service for encrypting/decrypting OAuth tokens and sensitive data.
    
    Uses Fernet encryption with a key derived from ENCRYPTION_KEY env variable.
    If no key is set, generates a warning and uses a derived key from JWT_SECRET_KEY.
    """
    
    _instance: Optional['TokenEncryptionService'] = None
    _fernet: Optional[Fernet] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialize()
        return cls._instance
    
    def _initialize(self):
        """Initialize Fernet cipher with encryption key."""
        from ..config import get_settings
        settings = get_settings()
        
        # Try to get dedicated encryption key first
        encryption_key = os.environ.get('ENCRYPTION_KEY', '')
        
        if encryption_key:
            # Use the provided encryption key
            try:
                # If it's already a valid Fernet key, use it directly
                self._fernet = Fernet(encryption_key.encode())
                logger.info("Token encryption initialized with ENCRYPTION_KEY")
                return
            except Exception:
                # Key provided but not valid Fernet format, derive from it
                pass
        
        # Fall back to deriving key from JWT secret (not ideal but better than plaintext)
        jwt_secret = settings.jwt_secret_key
        if not jwt_secret or len(jwt_secret) < 32:
            logger.error("No valid encryption key available. Token encryption disabled.")
            self._fernet = None
            return
        
        # Derive a Fernet-compatible key from JWT secret using PBKDF2
        salt = b'linkedin_content_saas_token_encryption_v1'
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(jwt_secret.encode()))
        self._fernet = Fernet(key)
        
        logger.warning(
            "Token encryption using derived key from JWT_SECRET_KEY. "
            "For production, set ENCRYPTION_KEY environment variable. "
            "Generate one with: python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
        )
    
    def encrypt(self, plaintext: str) -> Optional[str]:
        """
        Encrypt a plaintext string.
        
        Args:
            plaintext: The string to encrypt
            
        Returns:
            Base64-encoded encrypted string, or None if encryption unavailable
        """
        if not self._fernet or not plaintext:
            return plaintext  # Return as-is if encryption unavailable
        
        try:
            encrypted = self._fernet.encrypt(plaintext.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption failed: {str(e)}")
            return None
    
    def decrypt(self, ciphertext: str) -> Optional[str]:
        """
        Decrypt an encrypted string.
        
        Args:
            ciphertext: Base64-encoded encrypted string
            
        Returns:
            Decrypted plaintext string, or None if decryption fails
        """
        if not self._fernet or not ciphertext:
            return ciphertext  # Return as-is if encryption unavailable
        
        try:
            decrypted = self._fernet.decrypt(ciphertext.encode())
            return decrypted.decode()
        except InvalidToken:
            # This might be an unencrypted legacy token
            # Check if it looks like a plain OAuth token (starts with expected patterns)
            if ciphertext.startswith('AQ') or ciphertext.startswith('ey'):
                logger.warning("Found unencrypted legacy token, returning as-is")
                return ciphertext
            logger.error("Token decryption failed - invalid token")
            return None
        except Exception as e:
            logger.error(f"Decryption failed: {str(e)}")
            return None
    
    def is_encrypted(self, value: str) -> bool:
        """
        Check if a value appears to be encrypted.
        
        Fernet tokens start with 'gAAAAA' due to version byte and timestamp.
        """
        if not value:
            return False
        return value.startswith('gAAAAA')
    
    def encrypt_if_needed(self, value: str) -> str:
        """Encrypt only if not already encrypted."""
        if not value or self.is_encrypted(value):
            return value
        return self.encrypt(value) or value
    
    def decrypt_if_needed(self, value: str) -> str:
        """Decrypt only if encrypted."""
        if not value or not self.is_encrypted(value):
            return value
        return self.decrypt(value) or value


# Singleton instance
_encryption_service: Optional[TokenEncryptionService] = None


def get_encryption_service() -> TokenEncryptionService:
    """Get the singleton encryption service instance."""
    global _encryption_service
    if _encryption_service is None:
        _encryption_service = TokenEncryptionService()
    return _encryption_service


def encrypt_token(token: str) -> str:
    """Convenience function to encrypt a token."""
    return get_encryption_service().encrypt_if_needed(token)


def decrypt_token(token: str) -> str:
    """Convenience function to decrypt a token."""
    return get_encryption_service().decrypt_if_needed(token)
