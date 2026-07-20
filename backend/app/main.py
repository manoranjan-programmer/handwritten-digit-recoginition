"""
main.py
-------
FastAPI application entry point.

Startup lifecycle
-----------------
1. Configure logging (utils.configure_logging)
2. Download and load the Keras model (model_loader.load_model)
   — executed once inside the async lifespan context manager.

Routes
------
GET  /          → health check
GET  /health    → detailed health / readiness probe
POST /predict   → multipart image upload → digit prediction
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI, File, HTTPException, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.model_loader import load_model
from app.predictor import predict
from app.utils import configure_logging, validate_image_file

# ---------------------------------------------------------------------------
# Logging — must be configured before any logger is used
# ---------------------------------------------------------------------------
configure_logging()
logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Lifespan — runs on startup / shutdown
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """FastAPI lifespan handler.

    Loads the ML model once on startup so that every subsequent request
    reuses the same in-memory model (no re-loading overhead).
    """
    logger.info("Application starting up …")
    try:
        load_model()
        logger.info("Model ready. Application is accepting requests.")
    except Exception as exc:
        # Re-raise so the failure is visible immediately in the logs.
        # The /health endpoint will return 503 until the process restarts.
        logger.error("CRITICAL: Failed to load model during startup: %s", exc)
        raise RuntimeError(f"Startup failed — could not load model: {exc}") from exc
    yield
    logger.info("Application shutting down.")


# ---------------------------------------------------------------------------
# FastAPI app
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Handwritten Digit Recognition API",
    description=(
        "Upload a handwritten digit image (PNG/JPG) and receive the predicted "
        "digit (0–9) along with a confidence score."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ---------------------------------------------------------------------------
# CORS — allow the React frontend (and Vercel preview deployments) to call us
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    # In production, replace "*" with your exact Vercel domain, e.g.:
    # ["https://digit-recognition.vercel.app"]
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/", tags=["Health"])
async def root() -> dict[str, str]:
    """Root endpoint — quick liveness check."""
    return {"status": "ok", "message": "Digit Recognition API is running."}


@app.get("/health", tags=["Health"])
async def health_check() -> JSONResponse:
    """Detailed health / readiness probe.

    Returns 200 when the model is loaded, 503 otherwise.
    Kubernetes / Render / Hugging Face Spaces can use this for readiness.
    """
    from app.model_loader import _model  # noqa: PLC0415

    if _model is not None:
        return JSONResponse(
            content={"status": "healthy", "model_loaded": True},
            status_code=status.HTTP_200_OK,
        )
    return JSONResponse(
        content={"status": "unhealthy", "model_loaded": False},
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
    )


@app.post("/predict", tags=["Prediction"])
async def predict_digit(
    image: UploadFile = File(..., description="Handwritten digit image (PNG/JPG/JPEG)")
) -> JSONResponse:
    """Accept an uploaded image and return the predicted digit.

    Request
    -------
    ``Content-Type: multipart/form-data``  
    Field name: ``image``  
    Supported formats: PNG, JPG, JPEG, BMP, WebP  
    Maximum size: 10 MB

    Response (200)
    --------------
    ```json
    {
        "digit": 7,
        "confidence": 99.42,
        "inference_time_ms": 12.5
    }
    ```

    Error responses follow the standard FastAPI ``{"detail": "..."}`` shape.
    """
    # ------------------------------------------------------------------ #
    # 1. Read file bytes
    # ------------------------------------------------------------------ #
    try:
        image_bytes = await image.read()
    except Exception as exc:
        logger.warning("Failed to read uploaded file: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not read the uploaded file.",
        ) from exc

    # ------------------------------------------------------------------ #
    # 2. Validate filename / content-type / size
    # ------------------------------------------------------------------ #
    try:
        validate_image_file(
            filename=image.filename or "",
            content_type=image.content_type or "",
            file_size=len(image_bytes),
        )
    except ValueError as exc:
        logger.warning("File validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc

    # ------------------------------------------------------------------ #
    # 3. Run prediction pipeline
    # ------------------------------------------------------------------ #
    try:
        result = predict(image_bytes)
    except ValueError as exc:
        # Preprocessing failure — bad image data
        logger.warning("Preprocessing failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        ) from exc
    except RuntimeError as exc:
        # Model not loaded
        logger.error("Prediction runtime error: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Model is not available. Please try again later.",
        ) from exc
    except Exception as exc:
        logger.exception("Unexpected error during prediction: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred. Please try again.",
        ) from exc

    return JSONResponse(content=result, status_code=status.HTTP_200_OK)
