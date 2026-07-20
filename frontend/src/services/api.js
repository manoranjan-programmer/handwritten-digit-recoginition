import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL ?? '';

const apiClient = axios.create({
  baseURL: BASE_URL,
  // 30-second timeout — TF inference on a cold-start container can be slow
  timeout: 30_000,
  headers: {
    // Do NOT set Content-Type here — Axios sets it automatically to
    // "multipart/form-data; boundary=…" when it detects a FormData body.
    Accept: 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor — development logging
// ---------------------------------------------------------------------------
apiClient.interceptors.request.use(
  (config) => {
    if (import.meta.env.DEV) {
      console.debug(
        `[API] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`
      );
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---------------------------------------------------------------------------
// Response interceptor — normalise errors into plain Error objects
// ---------------------------------------------------------------------------
apiClient.interceptors.response.use(
  // Success path — return the response data directly
  (response) => response,

  // Error path — extract the most useful message available
  (error) => {
    let message = 'An unexpected error occurred. Please try again.';

    if (error.response) {
      // Server responded with a non-2xx status.
      // FastAPI returns errors as { "detail": "…" }
      const detail = error.response.data?.detail;
      if (typeof detail === 'string') {
        message = detail;
      } else if (Array.isArray(detail) && detail.length > 0) {
        // Pydantic validation error — detail is an array of objects
        message = detail.map((d) => d.msg ?? JSON.stringify(d)).join('; ');
      } else {
        message = `Server error ${error.response.status}: ${error.response.statusText}`;
      }
    } else if (error.request) {
      // Request was sent but no response received (network error / CORS / timeout)
      if (error.code === 'ECONNABORTED') {
        message =
          'The request timed out. The server may be starting up — please try again.';
      } else {
        message =
          'Could not reach the server. Check your connection or try again later.';
      }
    } else {
      // Something went wrong before the request was sent
      message = error.message ?? message;
    }

    if (import.meta.env.DEV) {
      console.error('[API] Error:', message, error);
    }

    // Attach the extracted message so callers can do: catch (e) => e.message
    const normalised = new Error(message);
    normalised.originalError = error;
    return Promise.reject(normalised);
  }
);

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Send an image file to POST /predict and return the prediction result.
 *
 * @param {File} imageFile — The File object selected by the user.
 * @returns {Promise<{
 *   digit: number,
 *   confidence: number,
 *   inference_time_ms: number
 * }>} Prediction result from the backend.
 *
 * @throws {Error} With a human-readable `.message` on any failure.
 *
 * @example
 * const { digit, confidence } = await predictDigit(file);
 * console.log(`Predicted: ${digit} (${confidence}% confident)`);
 */
export async function predictDigit(imageFile) {
  if (!imageFile) {
    throw new Error('No image file provided.');
  }

  // Build multipart/form-data — field name must match FastAPI parameter "image"
  const formData = new FormData();
  formData.append('image', imageFile);

  const response = await apiClient.post('/predict', formData);

  // Validate the shape of the response before returning
  const data = response.data;
  if (typeof data?.digit !== 'number' || typeof data?.confidence !== 'number') {
    throw new Error('Unexpected response format from server.');
  }

  return data;
}

/**
 * Check backend liveness / readiness.
 *
 * Useful for showing a "server is starting…" banner while the
 * Docker container is warming up on Hugging Face Spaces.
 *
 * @returns {Promise<{ status: string, model_loaded: boolean }>}
 */
export async function checkHealth() {
  const response = await apiClient.get('/health');
  return response.data;
}

// Export the raw client for any advanced usage (e.g. cancellation tokens)
export default apiClient;
