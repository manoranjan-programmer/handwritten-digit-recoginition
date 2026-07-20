/**
 * PredictionCard.jsx
 * ------------------
 * Displays prediction result in a clean white card.
 * States: loading | error | empty | result
 */

import Loader from './Loader.jsx';

function confidenceGradient(pct) {
  if (pct >= 80) return 'from-emerald-400 to-green-500';
  if (pct >= 50) return 'from-amber-400 to-orange-400';
  return 'from-red-400 to-rose-500';
}

function confidenceTier(pct) {
  if (pct >= 90) return { label: 'Very High', cls: 'text-emerald-600 bg-emerald-50' };
  if (pct >= 75) return { label: 'High',      cls: 'text-green-600 bg-green-50'    };
  if (pct >= 50) return { label: 'Medium',    cls: 'text-amber-600 bg-amber-50'    };
  return              { label: 'Low',        cls: 'text-red-600 bg-red-50'        };
}

function ProbRow({ digit, probability, isTop }) {
  const pct = (probability * 100).toFixed(1);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className={`w-4 text-right font-mono font-bold shrink-0
                        ${isTop ? 'text-blue-600' : 'text-slate-400'}`}>
        {digit}
      </span>
      <div className="flex-1 rounded-full overflow-hidden bg-slate-100" style={{ height: '6px' }}>
        <div
          className={`h-full rounded-full transition-all duration-500
                      ${isTop ? 'bg-blue-500' : 'bg-slate-300'}`}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={parseFloat(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      <span className={`w-11 text-right font-mono shrink-0
                        ${isTop ? 'text-slate-700 font-semibold' : 'text-slate-400'}`}>
        {pct}%
      </span>
    </div>
  );
}

export default function PredictionCard({ result, error, loading }) {
  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[260px] animate-fade-in">
        <Loader size="lg" label="Running inference…" />
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div role="alert"
           className="flex flex-col items-center gap-3 text-center py-8 animate-slide-up">
        <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200
                        flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
               className="w-5 h-5 text-red-500" aria-hidden="true">
            <path fillRule="evenodd"
              d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"/>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-red-600 text-sm">Prediction Failed</p>
          <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
        </div>
      </div>
    );
  }

  // Empty
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[260px]
                      text-center animate-fade-in">
        <div className="w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200
                        flex items-center justify-center">
          <span className="text-5xl font-black text-slate-200 select-none" aria-hidden="true">?</span>
        </div>
        <p className="text-slate-400 text-sm max-w-[200px] leading-relaxed">
          Draw or upload a digit, then click <strong className="text-slate-600">Predict Digit</strong>
        </p>
      </div>
    );
  }

  // Result
  const { digit, confidence, inference_time_ms, probabilities } = result;
  const tier = confidenceTier(confidence);
  const grad = confidenceGradient(confidence);

  return (
    <div className="flex flex-col gap-5 animate-slide-up"
         role="region" aria-label="Prediction result" aria-live="polite">

      {/* Top: digit + badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Big digit bubble */}
          <div className="w-20 h-20 rounded-2xl bg-blue-600 flex items-center justify-center
                          shadow-lg shadow-blue-200">
            <span className="text-5xl font-black text-white leading-none select-none"
                  aria-label={`Predicted digit: ${digit}`}>
              {digit}
            </span>
          </div>
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wide font-medium">
              Predicted
            </p>
            <p className="text-2xl font-black text-slate-800 leading-tight">
              Digit {digit}
            </p>
          </div>
        </div>
        {/* Inference time */}
        {inference_time_ms !== undefined && (
          <span className="text-xs font-mono text-slate-400 bg-slate-100 border border-slate-200
                           px-2.5 py-1 rounded-full self-start">
            {inference_time_ms} ms
          </span>
        )}
      </div>

      {/* Confidence */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Confidence</span>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tier.cls}`}>
              {tier.label}
            </span>
            <span className="text-lg font-black text-slate-800 font-mono">
              {confidence.toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="bar-track">
          <div
            className={`bar-fill bg-gradient-to-r ${grad}`}
            style={{ '--bar-w': `${confidence}%` }}
            role="progressbar"
            aria-valuenow={confidence}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Per-class probabilities */}
      {Array.isArray(probabilities) && probabilities.length === 10 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            All Classes
          </p>
          {probabilities.map((p, i) => (
            <ProbRow key={i} digit={i} probability={p} isTop={i === digit} />
          ))}
        </div>
      )}
    </div>
  );
}
