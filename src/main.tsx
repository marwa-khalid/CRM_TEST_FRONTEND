import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext'
// import { Provider } from 'react-redux'
// import { store } from './redux/store.ts'

// NOTE: React.StrictMode intentionally double-invokes effects in dev (mount →
// cleanup → mount). That fired every data-fetching effect twice (/users, /me,
// /case-activity/all, …) — and on the Case Activity all-cases view the second
// concurrent request raced the first and left the list wiped. Rendering without
// StrictMode makes the dev server behave like production (one call per effect).
createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
)
