import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center px-4">
      <span className="text-8xl font-black text-slate-200 select-none">404</span>
      <h2 className="text-xl font-bold text-slate-700">Page not found</h2>
      <a href="/" className="btn-primary mt-2">← Go Home</a>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/"  element={<Home />} />
          <Route path="*"  element={<NotFound />} />
        </Routes>
      </main>
      <footer className="py-4 text-center text-slate-400 text-xs border-t border-slate-200 bg-white">
        Powered by TensorFlow &amp; Hugging Face · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
