import { Outlet } from "react-router-dom";

import { CommandPalette } from "@/features/command-palette/CommandPalette";
import { useTrackRecent } from "@/features/history/useTrackRecent";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  useTrackRecent();

  return (
    <div className="ot-app">
      <Sidebar />
      <main className="ot-main">
        <TopBar />
        <div className="ot-content">
          <Outlet />
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
