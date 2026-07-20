"""
preprocess.py
-------------
Image preprocessing pipeline that converts an arbitrary input image into
the exact tensor format expected by the MNIST-trained Keras model:

    shape  : (1, 28, 28, 1)
    dtype  : float32
    range  : [0.0, 1.0]

The steps mirror the preprocessing applied during model training so that
inference results are accurate.
"""

import logging

import cv2
import numpy as np

logger = logging.getLogger(__name__)


def preprocess_image(image_bytes: bytes) -> np.ndarray:
    """Convert raw image bytes into a model-ready NumPy array.

    Pipeline
    --------
    1. Decode JPEG/PNG bytes into a BGR NumPy array via OpenCV.
    2. Convert BGR → Grayscale (single channel).
    3. Resize to 28×28 pixels using area interpolation (best for downscaling).
    4. Invert if the background is dark (MNIST uses white digit on black bg).
    5. Normalize pixel values from [0, 255] → [0.0, 1.0].
    6. Reshape to (1, 28, 28, 1) — batch size 1, height, width, channels.

    Args:
        image_bytes: Raw bytes of the uploaded image file.

    Returns:
        Float32 NumPy array of shape (1, 28, 28, 1).

    Raises:
        ValueError: If the bytes cannot be decoded as a valid image.
    """
    # ------------------------------------------------------------------ #
    # Step 1 — Decode bytes
    # ------------------------------------------------------------------ #
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        raise ValueError(
            "Could not decode the uploaded file as an image. "
            "Please upload a valid PNG or JPG."
        )

    logger.debug("Decoded image shape: %s", img.shape)

    # ------------------------------------------------------------------ #
    # Step 2 — Convert to grayscale
    # ------------------------------------------------------------------ #
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # ------------------------------------------------------------------ #
    # Step 3 — Resize to 28×28
    # ------------------------------------------------------------------ #
    resized = cv2.resize(gray, (28, 28), interpolation=cv2.INTER_AREA)

    # ------------------------------------------------------------------ #
    # Step 4 — Background normalisation
    # MNIST convention: digit is WHITE on a BLACK background.
    # If the uploaded image has a light background, invert it.
    # We check the mean brightness of the image to decide.
    # ------------------------------------------------------------------ #
    if resized.mean() > 127:
        resized = cv2.bitwise_not(resized)
        logger.debug("Image inverted to match MNIST convention.")

    # ------------------------------------------------------------------ #
    # Step 5 — Normalize to [0, 1]
    # ------------------------------------------------------------------ #
    normalized = resized.astype(np.float32) / 255.0

    # ------------------------------------------------------------------ #
    # Step 6 — Reshape to (1, 28, 28, 1)
    # ------------------------------------------------------------------ #
    tensor = normalized.reshape(1, 28, 28, 1)

    logger.debug("Final tensor shape: %s, dtype: %s", tensor.shape, tensor.dtype)
    return tensor
