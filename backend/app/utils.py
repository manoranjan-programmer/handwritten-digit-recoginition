"""
utils.py
--------
Shared utility helpers used across the FastAPI application.

Responsibilities:
  • File extension / MIME-type validation
  • File size guard
  • Logging configuration
"""

import logging
import sys
from typing import Final

# ---------------------------------------------------------------------------
# Allowed file types
# ---------------------------------------------------------------------------

ALLOWED_EXTENSIONS: Final[frozenset[str]] = frozenset(
    {".png", ".jpg", ".jpeg", ".bmp", ".webp"}
)

ALLOWED_CONTENT_TYPES: Final[frozenset[str]] = frozenset(
    {
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/bmp",
        "image/webp",
    }
)

# Maximum upload size: 10 MB
MAX_FILE_SIZE_BYTES: Final[int] = 10 * 1024 * 1024  # 10 MB


# ---------------------------------------------------------------------------
# Validation helpers
# ---------------------------------------------------------------------------


def validate_image_file(filename: str, content_type: str, file_size: int) -> None:
    """Validate the uploaded file before any processing occurs.

    Raises:
        ValueError: With a human-readable message describing the problem.
    """
    if not filename:
        raise ValueError("No filename provided.")

    # Check extension
    suffix = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if suffix not in ALLOWED_EXTENSIONS:
        raise ValueError(
            f"Unsupported file extension '{suffix}'. "
            f"Allowed types: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    # Check MIME type
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValueError(
            f"Unsupported content type '{content_type}'. "
            f"Expected an image (PNG / JPEG / BMP / WebP)."
        )

    # Check file size
    if file_size == 0:
        raise ValueError("Uploaded file is empty.")

    if file_size > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise ValueError(
            f"File size exceeds the maximum allowed size of {max_mb} MB."
        )


# ---------------------------------------------------------------------------
# Logging setup
# ---------------------------------------------------------------------------


def configure_logging(level: int = logging.INFO) -> None:
    """Configure root logger with a consistent format.

    Should be called once at application startup before any loggers are used.

    Args:
        level: Python logging level constant (default: ``logging.INFO``).
    """
    logging.basicConfig(
        level=level,
        format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        stream=sys.stdout,
    )
    # Silence noisy third-party loggers
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("tensorflow").setLevel(logging.ERROR)
    logging.getLogger("absl").setLevel(logging.ERROR)
