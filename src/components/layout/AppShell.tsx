import { Outlet } from "react-router-dom";

import { CommandPalette } from "@/features/command-palette/CommandPalette";
import { useTrackRecent } from "@/features/history/useTrackRecent";

import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";

export function AppShell() {
  useTrackRecent();

  return (
    <div className="flex h-full overflow-hidden bg-base">
      <Sidebar />
      <main className="flex h-full min-w-0 flex-1 flex-col">
        <TopBar />
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-5">
          <Outlet />
        </div>
      </main>
      <CommandPalette />
    </div>
  );
}
