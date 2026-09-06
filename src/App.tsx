import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { Home } from './pages/Home'
import { Add } from './pages/Add'
import { Review } from './pages/Review'
import { Library } from './pages/Library'
import { WeakSpots } from './pages/WeakSpots'
import { Quiz } from './pages/Quiz'
import { ThemeToggle } from './components/ThemeToggle'
import { InstallPrompt } from './components/InstallPrompt'
import { Reminder } from './components/Reminder'
import { Splash } from './components/Splash'

export default function App() {
  return (
    <HashRouter>
      <div className="min-h-dvh bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-slate-100">
        <div className="mx-auto max-w-3xl px-4 pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/add" element={<Add />} />
            <Route path="/review" element={<Review />} />
            <Route path="/library" element={<Library />} />
            <Route path="/weak" element={<WeakSpots />} />
            <Route path="/quiz" element={<Quiz />} />
          </Routes>
          <BottomNav />
        </div>
      </div>
      <ThemeToggle />
      <InstallPrompt />
      <Reminder />
      <Splash />
    </HashRouter>
  )
}

function BottomNav() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center gap-0.5 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
      isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-gray-400'
    }`
  return (
    <nav className="fixed bottom-0 inset-x-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-gray-200 dark:border-slate-800">
      <div className="mx-auto max-w-3xl px-4 py-2 flex justify-around">
        <NavLink to="/" end className={linkClass}>Home</NavLink>
        <NavLink to="/add" className={linkClass}>Add</NavLink>
        <NavLink to="/review" className={linkClass}>Review</NavLink>
        <NavLink to="/library" className={linkClass}>Library</NavLink>
        <NavLink to="/weak" className={linkClass}>Weak</NavLink>
        <NavLink to="/quiz" className={linkClass}>Quiz</NavLink>
      </div>
    </nav>
  )
}
