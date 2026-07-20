/**
 * Home.jsx
 * --------
 * Main page. Two input modes:
 *   • Draw  — canvas whiteboard (DrawingCanvas)
 *   • Upload — file picker / drag-and-drop (UploadCard)
 *
 * Both modes share the same PredictionCard result panel.
 */

import { useState, useCallback, useEffect, useRef } from 'react';

import DrawingCanvas  from '../components/DrawingCanvas.jsx';
import UploadCard     from '../components/UploadCard.jsx';
import PredictionCard from '../components/PredictionCard.jsx';
import { predictDigit } from '../services/api.js';

// ── Converts a Blob to a File so the existing predictDigit(file) API works ─
function blobToFile(blob, name = 'drawing.png') {
  return new File([blob], name, { type: blob.type });
}

// ── Tab identifiers ─────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'draw',
    label: 'Draw',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
           className="w-4 h-4" aria-hidden="true">
        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
      </svg>
    ),
  },
  {
    id: 'upload',
    label: 'Upload',
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
           className="w-4 h-4" aria-hidden="true">
        <path fillRule="evenodd"
          d="M9.25 3.75a.75.75 0 011.5 0V10a.75.75 0 01-1.5 0V3.75zM6.05 6.36a.75.75 0 011.06.04L10 9.09l2.89-2.69a.75.75 0 011.02 1.1l-3.5 3.25a.75.75 0 01-1.02 0l-3.5-3.25a.75.75 0 01.16-1.14z"
          clipRule="evenodd"/>
        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z"/>
      </svg>
    ),
  },
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('draw');

  // Upload mode state
  const [file,    setFile]    = useState(null);
  const [preview, setPreview] = useState(null);
  const previewRef            = useRef(null);

  // Shared prediction state
  const [result,  setResult]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  // Revoke object URL on unmount
  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  // Clear results when switching tab
  const switchTab = useCallback((id) => {
    setActiveTab(id);
    setResult(null);
    setError(null);
  }, []);

  // ── Shared predict runner ────────────────────────────────────────────────
  const runPredict = useCallback(async (fileOrBlob) => {
    const f = fileOrBlob instanceof File ? fileOrBlob : blobToFile(fileOrBlob);
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await predictDigit(f);
      setResult(data);
    } catch (err) {
      setError(err.message ?? 'Unexpected error. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Upload mode handlers ─────────────────────────────────────────────────
  const handleFileSelect = useCallback((f) => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(f);
    previewRef.current = url;
    setFile(f);
    setPreview(url);
    setResult(null);
    setError(null);
  }, []);

  const handleReset = useCallback(() => {
    if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; }
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
  }, []);

  // Enter shortcut (upload mode only)
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Enter' && activeTab === 'upload' && file && !loading) runPredict(file);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [activeTab, file, loading, runPredict]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="text-center animate-fade-in">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                         text-blue-600 bg-blue-50 border border-blue-100
                         px-3 py-1 rounded-full uppercase tracking-widest mb-3">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" aria-hidden="true"/>
          TensorFlow · CNN · MNIST
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tight">
          Handwritten Digit Recognition
        </h1>
        <p className="text-slate-500 mt-2 text-sm sm:text-base max-w-lg mx-auto">
          Draw a digit on the whiteboard or upload an image — the model predicts it instantly.
        </p>
      </div>

      {/* ── Main card ────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden animate-slide-up">

        {/* Tab bar */}
        <div className="flex items-center gap-1 p-4 pb-0 border-b border-slate-100">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchTab(tab.id)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-semibold',
                'border-b-2 -mb-px transition-all duration-150',
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-blue-50/60'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50',
              ].join(' ')}
              aria-selected={activeTab === tab.id}
              role="tab"
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">

          {/* Left — input panel */}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">
              {activeTab === 'draw' ? 'Draw your digit' : 'Upload an image'}
            </h2>

            {activeTab === 'draw' ? (
              <DrawingCanvas onPredict={runPredict} loading={loading} />
            ) : (
              <UploadCard
                file={file}
                preview={preview}
                onFileSelect={handleFileSelect}
                onPredict={() => file && runPredict(file)}
                onReset={handleReset}
                loading={loading}
              />
            )}
          </div>

          {/* Right — result panel */}
          <div className="p-6">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Result</h2>
            <PredictionCard result={result} error={error} loading={loading} />
          </div>
        </div>
      </div>

      {/* ── Info strip ───────────────────────────────────────────────────── */}
      <div className="card px-6 py-4 animate-fade-in">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2">
          {[
            ['Model',     'CNN (MNIST)'],
            ['Framework', 'TensorFlow 2.16'],
            ['Input',     '28 × 28 grayscale'],
            ['Classes',   '0 – 9  (10 total)'],
            ['Hosted on', 'Hugging Face Hub'],
          ].map(([k, v]) => (
            <div key={k} className="flex items-center gap-1.5 text-xs">
              <span className="font-semibold text-slate-400 uppercase tracking-wide">{k}</span>
              <span className="text-slate-600">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <div className="animate-fade-in">
        <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
          How it works
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: '✏️', step: '1', title: 'Input',      desc: 'Draw or upload a digit image' },
            { icon: '⚙️', step: '2', title: 'Preprocess', desc: 'Resize to 28×28, normalise' },
            { icon: '🧠', step: '3', title: 'Infer',      desc: 'TensorFlow CNN prediction' },
            { icon: '✅', step: '4', title: 'Result',     desc: 'Digit + confidence score' },
          ].map(({ icon, step, title, desc }) => (
            <div key={step}
                 className="card p-4 flex flex-col items-center gap-2 text-center">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center
                              text-xl select-none" aria-hidden="true">
                {icon}
              </div>
              <div>
                <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Step {step}</p>
                <p className="text-sm font-semibold text-slate-700">{title}</p>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
