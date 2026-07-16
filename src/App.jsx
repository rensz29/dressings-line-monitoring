import { useState } from 'react'
import LineMonitor from './LineMonitor';
import SettingsPage from './pages/SettingsPage.jsx';

function App() {
  const [view, setView] = useState("dashboard");

  return view === "settings"
    ? <SettingsPage onBack={() => setView("dashboard")} />
    : <LineMonitor onOpenSettings={() => setView("settings")} />;
}

export default App
