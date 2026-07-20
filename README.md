# Handwritten Digit Recognition

A production-ready full-stack web application that recognises handwritten digits (0–9) from uploaded images using a TensorFlow CNN model served by FastAPI and displayed through a React 19 frontend.

---

## Features

- **Drag-and-drop or click-to-browse** image upload (PNG, JPG, JPEG, BMP, WebP)
- **Live image preview** before submitting
- **Real-time prediction** — digit (0–9), confidence %, and inference time (ms)
- **Animated confidence bar** with colour-coded tiers (green / yellow / red)
- **Per-class probability breakdown** for all 10 digit classes
- **Glassmorphism UI** with blue gradient theme, fully responsive
- **Model loaded once on startup** — no per-request reload overhead
- **Auto-download model** from Hugging Face Hub on first start
- **CORS-enabled** API ready for cross-origin frontends
- **Docker-ready** for Hugging Face Spaces and Render deployment
- **Vercel-ready** frontend with SPA rewrites and security headers
- Keyboard shortcut: press `Enter` to predict after selecting an image

---

## Architecture

```
Browser (React 19 + Vite)
        │
        │  POST /predict  (multipart/form-data)
        ▼
FastAPI Backend (Uvicorn)
        │
        ├── preprocess.py   — OpenCV image pipeline
        ├── predictor.py    — orchestration layer
        ├── model_loader.py — HF Hub download + Keras singleton
        │
        ▼
TensorFlow/Keras CNN
(digit_model.keras — hosted on Hugging Face Hub)
```

**Data flow:**

```
Upload image
    ↓
Validate (extension, MIME type, size)
    ↓
Read bytes
    ↓
Decode → Grayscale → Resize 28×28 → Invert if needed → Normalise [0,1]
    ↓
Reshape (1, 28, 28, 1)
    ↓
model.predict()
    ↓
argmax → digit   softmax[digit] × 100 → confidence %
    ↓
JSON response → React frontend
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 19 + Vite |
| Styling | Tailwind CSS 3 |
| HTTP client | Axios |
| Routing | React Router v6 |
| Backend framework | FastAPI |
| ASGI server | Uvicorn |
| ML framework | TensorFlow 2.16 / Keras |
| Image processing | OpenCV (headless) |
| Model hosting | Hugging Face Hub |
| Frontend deploy | Vercel |
| Backend deploy | Hugging Face Spaces (Docker) / Render |

---

## Project Structure

```
digit-recognition/
├── .gitignore
├── README.md
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── vercel.json                   ← SPA rewrites + security headers
│   ├── .env.example
│   └── src/
│       ├── main.jsx                  ← React 19 entry point
│       ├── App.jsx                   ← Router + layout shell
│       ├── index.css                 ← Tailwind + global tokens
│       ├── components/
│       │   ├── Navbar.jsx            ← Glass sticky nav
│       │   ├── UploadCard.jsx        ← Drag-drop + preview
│       │   ├── PredictionCard.jsx    ← Result display
│       │   └── Loader.jsx            ← Animated spinner
│       ├── pages/
│       │   └── Home.jsx              ← Page orchestration
│       └── services/
│           └── api.js                ← Axios instance + predictDigit()
│
└── backend/
    ├── requirements.txt
    ├── Dockerfile                    ← Two-stage build
    ├── .dockerignore
    ├── .env.example
    └── app/
        ├── __init__.py
        ├── main.py                   ← FastAPI app + routes
        ├── model_loader.py           ← HF Hub download + singleton
        ├── predictor.py              ← Prediction orchestration
        ├── preprocess.py             ← OpenCV image pipeline
        └── utils.py                  ← Validation + logging
```

---

## Local Development

### Prerequisites

- **Node.js** 20+ and **npm** 10+
- **Python** 3.11+
- A Hugging Face model repo containing `digit_model.keras`  
  (see [Upload Your Model](#upload-your-model) below)

---

### Backend

```bash
# 1. Navigate to the backend directory
cd digit-recognition/backend

# 2. Create and activate a virtual environment
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env — set HF_REPO_ID to your Hugging Face model repo

# 5. Start the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API is now available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### Frontend

```bash
# 1. Navigate to the frontend directory
cd digit-recognition/frontend

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local — set VITE_API_URL=http://localhost:8000

# 4. Start the development server
npm run dev
```

The app is now available at `http://localhost:5173`.

---

### Upload Your Model

The backend expects a file named `digit_model.keras` in a Hugging Face repository.

**Train and export a model (example):**

```python
import tensorflow as tf
from tensorflow.keras import layers, models

# Load MNIST
(x_train, y_train), (x_test, y_test) = tf.keras.datasets.mnist.load_data()
x_train = x_train.reshape(-1, 28, 28, 1).astype("float32") / 255.0
x_test  = x_test.reshape(-1, 28, 28, 1).astype("float32") / 255.0

# Build CNN
model = models.Sequential([
    layers.Input(shape=(28, 28, 1)),
    layers.Conv2D(32, 3, activation="relu"),
    layers.MaxPooling2D(),
    layers.Conv2D(64, 3, activation="relu"),
    layers.MaxPooling2D(),
    layers.Flatten(),
    layers.Dense(128, activation="relu"),
    layers.Dropout(0.3),
    layers.Dense(10, activation="softmax"),
])

model.compile(optimizer="adam",
              loss="sparse_categorical_crossentropy",
              metrics=["accuracy"])

model.fit(x_train, y_train, epochs=10, validation_split=0.1)
model.save("digit_model.keras")
```

**Push to Hugging Face Hub:**

```bash
pip install huggingface_hub

python - <<'EOF'
from huggingface_hub import HfApi

api = HfApi()
api.create_repo("digit-recognition-model", exist_ok=True)
api.upload_file(
    path_or_fileobj="digit_model.keras",
    path_in_repo="digit_model.keras",
    repo_id="YOUR_USERNAME/digit-recognition-model",
)
print("Model uploaded successfully.")
EOF
```

---

## API Documentation

### `GET /`
Liveness check.

**Response `200`**
```json
{ "status": "ok", "message": "Digit Recognition API is running." }
```

---

### `GET /health`
Readiness probe — confirms the model is loaded.

**Response `200`** (ready)
```json
{ "status": "healthy", "model_loaded": true }
```

**Response `503`** (model not yet loaded)
```json
{ "status": "unhealthy", "model_loaded": false }
```

---

### `POST /predict`
Predict the digit in an uploaded image.

**Request**
```
Content-Type: multipart/form-data
Field:        image  (File)
```

**Response `200`**
```json
{
  "digit": 7,
  "confidence": 99.42,
  "inference_time_ms": 12.5
}
```

**Error responses**

| Status | Reason |
|---|---|
| `422` | Invalid file extension, unsupported MIME type, empty file, or corrupted image |
| `503` | Model not loaded (server still starting) |
| `500` | Unexpected internal error |

All errors follow FastAPI's standard shape:
```json
{ "detail": "Human-readable error message" }
```

---

## Deployment

### Frontend → Vercel

1. Push the repository to GitHub.
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo.
3. Set **Root Directory** to `frontend`.
4. Add the environment variable:
   ```
   VITE_API_URL = https://your-backend-url.hf.space
   ```
5. Click **Deploy**.

`vercel.json` is already included — it configures SPA rewrites and security headers automatically.

---

### Backend → Hugging Face Spaces (Docker)

1. Create a new Space at [huggingface.co/new-space](https://huggingface.co/new-space).
   - SDK: **Docker**
   - Visibility: Public (or Private with a token)

2. Push the `backend/` folder contents to the Space repository:
   ```bash
   git clone https://huggingface.co/spaces/YOUR_USERNAME/digit-recognition-api
   cp -r digit-recognition/backend/* digit-recognition-api/
   cd digit-recognition-api
   git add .
   git commit -m "Deploy FastAPI backend"
   git push
   ```

3. Add Secrets in the Space settings:
   ```
   HF_REPO_ID   = YOUR_USERNAME/digit-recognition-model
   HF_TOKEN     = hf_xxxx   (only if the model repo is private)
   ```

4. Hugging Face Spaces will build the Docker image and start the container.  
   Your API will be live at `https://YOUR_USERNAME-digit-recognition-api.hf.space`.

---

### Backend → Render

1. Create a new **Web Service** at [render.com](https://render.com).
2. Connect your GitHub repo, set **Root Directory** to `backend`.
3. Set:
   - **Environment**: Docker
   - **Port**: `8000`
4. Add environment variables:
   ```
   HF_REPO_ID         = YOUR_USERNAME/digit-recognition-model
   HF_MODEL_FILENAME  = digit_model.keras
   ```
5. Deploy.

---

## Environment Variables Reference

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Base URL of the FastAPI backend |

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `HF_REPO_ID` | `Mano-Ranjan/digit-recognition-model` | Hugging Face model repository |
| `HF_MODEL_FILENAME` | `digit_model.keras` | Model filename inside the repo |
| `MODEL_CACHE_DIR` | `./model_cache` | Local cache path for the downloaded model |
| `PORT` | `8000` | Uvicorn listening port (7860 on HF Spaces) |
| `HF_TOKEN` | _(unset)_ | HF access token — only needed for private repos |

---

## How It Works

1. **Startup** — `model_loader.load_model()` is called inside the FastAPI lifespan handler. It uses `hf_hub_download` to fetch `digit_model.keras` from Hugging Face Hub (cached locally on subsequent starts) and loads it with `tf.keras.models.load_model()`. The model is stored as a module-level singleton.

2. **Request** — The user uploads an image via the React frontend. Axios sends a `multipart/form-data` POST to `/predict`.

3. **Validation** — `utils.validate_image_file` checks the filename extension, MIME type, and file size before any ML work is done.

4. **Preprocessing** — `preprocess.preprocess_image` decodes the bytes with OpenCV, converts to grayscale, resizes to 28×28, inverts if the background is light (to match MNIST convention), normalises to `[0, 1]`, and reshapes to `(1, 28, 28, 1)`.

5. **Inference** — `predictor.predict` calls `model.predict()` on the prepared tensor. The predicted digit is `argmax(softmax_output)` and confidence is `softmax_output[digit] × 100`.

6. **Response** — FastAPI returns `{ digit, confidence, inference_time_ms }` as JSON.

7. **Display** — React renders the digit in large gradient text, fills an animated confidence bar, and shows the per-class probability breakdown.

---

## Future Improvements

- **Canvas drawing** — let users draw a digit directly in the browser instead of uploading an image
- **Batch prediction** — accept multiple images in one request
- **Model versioning** — tag model releases on Hugging Face and expose the version in the `/health` response
- **Prediction history** — store past predictions in localStorage or a lightweight DB
- **Progressive Web App** — add a service worker and manifest for offline / installable support
- **Automated retraining** — GitHub Actions workflow that retrains and re-uploads the model when new labelled data is pushed
- **Explainability** — overlay a Grad-CAM heatmap on the image to highlight which pixels drove the prediction
- **Auth** — add API key authentication for production rate limiting
- **Monitoring** — integrate structured logging + Prometheus metrics endpoint

---

## License

MIT — see [LICENSE](LICENSE) for details.
