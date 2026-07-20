/** Simple spinner — used inside PredictionCard while request is in flight */
export default function Loader({ size = 'md', label = 'Analyzing…' }) {
  const sz = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }[size];
  const tx = { sm: 'text-xs', md: 'text-sm', lg: 'text-base' }[size];
  const sw = { sm: 3, md: 3, lg: 2.5 }[size];

  return (
    <div className="flex flex-col items-center gap-3" role="status" aria-live="polite">
      <svg className={`${sz} animate-spin text-blue-500`}
           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={sw} className="opacity-20"/>
        <path stroke="currentColor" strokeWidth={sw} strokeLinecap="round"
              d="M12 2a10 10 0 019.19 6.07" className="opacity-80"/>
      </svg>
      {label && <p className={`${tx} text-slate-500 font-medium`}>{label}</p>}
    </div>
  );
}
