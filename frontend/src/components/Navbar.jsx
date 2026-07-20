import { Link } from 'react-router-dom';

function BrainIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
         className="w-5 h-5 text-blue-600" aria-hidden="true">
      <path d="M9.5 2a2.5 2.5 0 0 1 5 0v.5"/>
      <path d="M9 3.5C6 4.5 4 7 4 10c0 4 3 7 6 8"/>
      <path d="M15 3.5c3 1 5 3.5 5 6.5 0 4-3 7-6 8"/>
      <path d="M12 12v10"/>
      <path d="M8 16h8"/>
    </svg>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm" role="banner">
      <nav
        className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-slate-800 hover:text-blue-600
                     transition-colors focus-visible:outline-none focus-visible:ring-2
                     focus-visible:ring-blue-500 rounded-lg"
          aria-label="Digit Recognition — home"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <BrainIcon />
          </div>
          <span className="text-base">
            Digit<span className="text-blue-600">AI</span>
          </span>
        </Link>

        {/* Right links */}
        <div className="flex items-center gap-1">
          <a
            href={`${import.meta.env.VITE_API_URL ?? 'http://localhost:8000'}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-sm text-slate-500
                       hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100
                       transition-colors"
          >
            API Docs
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"
                 className="w-3 h-3 opacity-60" aria-hidden="true">
              <path d="M6.22 8.72a.75.75 0 001.06 1.06l5.22-5.22v1.69a.75.75 0 001.5 0v-3.5a.75.75 0 00-.75-.75h-3.5a.75.75 0 000 1.5h1.69L6.22 8.72z"/>
              <path d="M3.5 6.75c0-.69.56-1.25 1.25-1.25H7A.75.75 0 007 4H4.75A2.75 2.75 0 002 6.75v4.5A2.75 2.75 0 004.75 14h4.5A2.75 2.75 0 0012 11.25V9a.75.75 0 00-1.5 0v2.25c0 .69-.56 1.25-1.25 1.25h-4.5c-.69 0-1.25-.56-1.25-1.25v-4.5z"/>
            </svg>
          </a>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500
                       hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100
                       transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                 className="w-4 h-4" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            <span className="hidden sm:inline">GitHub</span>
          </a>
        </div>
      </nav>
    </header>
  );
}
