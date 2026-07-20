/**
 * UploadCard.jsx
 * --------------
 * Handles drag-and-drop / click-to-browse image selection with a clean
 * white professional theme.
 */

import { useRef, useState, useCallback } from 'react';

const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/bmp', 'image/webp'];

function isValidImage(file) {
  return ACCEPTED_TYPES.includes(file.type);
}

export default function UploadCard({ file, preview, onFileSelect, onPredict, onReset, loading }) {
  const inputRef                = useRef(null);
  const [isDragging, setIsDrag] = useState(false);
  const [dragError,  setDragErr]= useState('');

  const onDragEnter = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    setIsDrag(true); setDragErr('');
  }, []);

  const onDragLeave = useCallback((e) => {
    e.preventDefault(); e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget)) setIsDrag(false);
  }, []);

  const onDragOver = useCallback((e) => { e.preventDefault(); e.stopPropagation(); }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault(); e.stopPropagation(); setIsDrag(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!isValidImage(f)) { setDragErr(`"${f.name}" is not a supported image type.`); return; }
    setDragErr(''); onFileSelect(f);
  }, [onFileSelect]);

  const onChange = useCallback((e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!isValidImage(f)) { setDragErr(`"${f.name}" is not supported.`); return; }
    setDragErr(''); onFileSelect(f);
    e.target.value = '';
  }, [onFileSelect]);

  return (
    <div className="flex flex-col gap-4">
      {/* Drop zone / preview */}
      {!preview ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Click or drag an image to upload"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragEnter={onDragEnter}
          onDragLeave={onDragLeave}
          onDragOver={onDragOver}
          onDrop={onDrop}
          className={[
            'flex flex-col items-center justify-center gap-3 rounded-xl',
            'border-2 border-dashed cursor-pointer min-h-[220px]',
            'transition-all duration-200 select-none',
            isDragging
              ? 'border-blue-400 bg-blue-50 scale-[1.005]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50',
          ].join(' ')}
        >
          {/* Upload cloud icon */}
          <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors
                          ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
                 stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                 className={`w-7 h-7 transition-colors ${isDragging ? 'text-blue-500' : 'text-slate-400'}`}
                 aria-hidden="true">
              <path d="M12 16V4m0 0-4 4m4-4 4 4"/>
              <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/>
            </svg>
          </div>
          <div className="text-center">
            <p className={`text-sm font-semibold transition-colors
                          ${isDragging ? 'text-blue-600' : 'text-slate-600'}`}>
              {isDragging ? 'Drop to upload' : 'Click to browse or drag & drop'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, JPEG, BMP, WebP · max 10 MB</p>
          </div>
        </div>
      ) : (
        /* Image preview */
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
          <img
            src={preview}
            alt="Preview of uploaded handwritten digit"
            className="w-full max-h-64 object-contain block"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm
                          border-t border-slate-200 px-3 py-1.5 flex items-center justify-between">
            <span className="text-xs text-slate-600 font-medium truncate max-w-[70%]">
              {file?.name}
            </span>
            <span className="text-xs text-slate-400">
              {file ? (file.size / 1024).toFixed(1) + ' KB' : ''}
            </span>
          </div>
        </div>
      )}

      {dragError && (
        <p role="alert" className="text-red-500 text-xs -mt-2 flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
               className="w-3.5 h-3.5" aria-hidden="true">
            <path fillRule="evenodd"
              d="M6.701 2.25c.577-1 2.02-1 2.598 0l5.196 9a1.5 1.5 0 01-1.299 2.25H2.804a1.5 1.5 0 01-1.3-2.25l5.197-9zM8 4a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"/>
          </svg>
          {dragError}
        </p>
      )}

      <input ref={inputRef} type="file"
             accept="image/png,image/jpeg,image/jpg,image/bmp,image/webp"
             className="sr-only" aria-hidden="true" tabIndex={-1} onChange={onChange}/>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onPredict}
          disabled={!file || loading}
          className="btn-primary flex-1"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg"
                   fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                        className="opacity-25"/>
                <path stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                      d="M12 2a10 10 0 019.19 6.07" className="opacity-75"/>
              </svg>
              Predicting…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                   className="w-4 h-4" aria-hidden="true">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.114A28.897 28.897 0 003.105 2.289z"/>
              </svg>
              Predict Digit
            </>
          )}
        </button>

        {file ? (
          <button type="button" onClick={onReset} disabled={loading} className="btn-outline">
            Clear
          </button>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()} className="btn-outline">
            Browse
          </button>
        )}
      </div>
    </div>
  );
}
