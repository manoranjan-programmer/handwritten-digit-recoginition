"""
predictor.py
------------
Thin orchestration layer that ties together:
  • preprocess.py  — raw bytes → model tensor
  • model_loader.py — singleton Keras model

Keeps the prediction logic isolated from the FastAPI routing layer so it
can be unit-tested independently.
"""

import logging
import time
from typing import TypedDict

import numpy as np

from app.model_loader import get_model
from app.preprocess import preprocess_image

logger = logging.getLogger(__name__)


class PredictionResult(TypedDict):
    """Typed dictionary returned by :func:`predict`."""

    digit: int
    confidence: float        # percentage, e.g. 99.42
    inference_time_ms: float # wall-clock time for the forward pass


def predict(image_bytes: bytes) -> PredictionResult:
    """Run the full prediction pipeline on raw image bytes.

    Args:
        image_bytes: Raw bytes of the uploaded image.

    Returns:
        A :class:`PredictionResult` with the predicted digit (0-9),
        confidence score as a percentage, and inference time in milliseconds.

    Raises:
        ValueError: If preprocessing fails (invalid image bytes).
        RuntimeError: If the model has not been loaded yet.
    """
    # ------------------------------------------------------------------ #
    # 1. Preprocess — may raise ValueError for bad images
    # ------------------------------------------------------------------ #
    tensor = preprocess_image(image_bytes)

    # ------------------------------------------------------------------ #
    # 2. Retrieve the already-loaded model singleton
    # ------------------------------------------------------------------ #
    model = get_model()

    # ------------------------------------------------------------------ #
    # 3. Forward pass — time it for the inference_time response field
    # ------------------------------------------------------------------ #
    start = time.perf_counter()
    predictions: np.ndarray = model.predict(tensor, verbose=0)  # shape (1, 10)
    elapsed_ms = (time.perf_counter() - start) * 1000

    # ------------------------------------------------------------------ #
    # 4. Decode output — softmax probabilities over 10 classes (digits 0-9)
    # ------------------------------------------------------------------ #
    probabilities = predictions[0]          # shape (10,)
    predicted_digit: int = int(np.argmax(probabilities))
    confidence: float = round(float(probabilities[predicted_digit]) * 100, 2)

    logger.info(
        "Prediction → digit=%d  confidence=%.2f%%  time=%.1f ms",
        predicted_digit,
        confidence,
        elapsed_ms,
    )

    return PredictionResult(
        digit=predicted_digit,
        confidence=confidence,
        inference_time_ms=round(elapsed_ms, 2),
    )
