"""
model_loader.py
---------------
Responsible for downloading the trained Keras model from Hugging Face Hub
and loading it into memory exactly once at application startup.

The loaded model is stored as a module-level singleton so every request
handler reuses the same TensorFlow graph without re-loading from disk.
"""

import logging
import os
from pathlib import Path

import tensorflow as tf
from huggingface_hub import hf_hub_download

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration — override via environment variables if needed
# ---------------------------------------------------------------------------

# Hugging Face repository that stores the trained model file.
# Must be in "owner/repo-name" format — NOT a full URL.
HF_REPO_ID: str = os.getenv("HF_REPO_ID", "manoranjan-programmer/handwritten-digit-recoginition")

# Filename inside the repository.
HF_MODEL_FILENAME: str = os.getenv("HF_MODEL_FILENAME", "handwritten_digit_model.keras")

# Local cache directory so the model is not re-downloaded on every cold start.
MODEL_CACHE_DIR: str = os.getenv("MODEL_CACHE_DIR", "./model_cache")

# ---------------------------------------------------------------------------
# Module-level singleton — populated once during startup lifespan
# ---------------------------------------------------------------------------
_model: tf.keras.Model | None = None


def get_model() -> tf.keras.Model:
    """Return the loaded Keras model.

    Raises:
        RuntimeError: If called before :func:`load_model` has completed
            successfully (e.g. during a unit test that skips startup).
    """
    if _model is None:
        raise RuntimeError(
            "Model is not loaded yet. Ensure load_model() is called during startup."
        )
    return _model


def load_model() -> tf.keras.Model:
    """Download (if necessary) and load the Keras model from Hugging Face.

    The function:
    1. Creates the local cache directory if it does not exist.
    2. Calls ``hf_hub_download`` which skips the download when the file is
       already present in the cache (idempotent).
    3. Loads the model with ``tf.keras.models.load_model``.
    4. Stores the result in the module-level ``_model`` singleton.

    Returns:
        The loaded ``tf.keras.Model`` instance.

    Raises:
        RuntimeError: On any download or load failure.
    """
    global _model

    # Create cache directory
    cache_path = Path(MODEL_CACHE_DIR)
    cache_path.mkdir(parents=True, exist_ok=True)

    logger.info(
        "Downloading model '%s' from Hugging Face repo '%s' …",
        HF_MODEL_FILENAME,
        HF_REPO_ID,
    )

    try:
        # hf_hub_download returns the local path to the cached file.
        # If the file is already present and unchanged, it returns immediately.
        model_path: str = hf_hub_download(
            repo_id=HF_REPO_ID,
            filename=HF_MODEL_FILENAME,
            cache_dir=str(cache_path),
        )
        logger.info("Model cached at: %s", model_path)
    except Exception as exc:
        raise RuntimeError(
            f"Failed to download model from Hugging Face Hub: {exc}"
        ) from exc

    logger.info("Loading TensorFlow/Keras model …")
    try:
        _model = tf.keras.models.load_model(model_path)
        logger.info("Model loaded successfully. Input shape: %s", _model.input_shape)
    except Exception as exc:
        raise RuntimeError(f"Failed to load Keras model from '{model_path}': {exc}") from exc

    return _model
