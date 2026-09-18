import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function AppShell() {
  return (
    <div className="dw-shell">
      <TopBar />
      <div className="dw-shell__body">
        <Sidebar />
        <main className="dw-shell__main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
