import { HashRouter, Route, Routes } from "react-router-dom";

import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui";
import { ThemeProvider } from "@/features/theme/ThemeProvider";
import { AboutPage } from "@/pages/AboutPage";
import { HomePage } from "@/pages/HomePage";
import { NotFoundPage } from "@/pages/NotFoundPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { toolRoutes } from "@/tools/registry";

export function App() {
  return (
    <ThemeProvider>
      {/* 桌面端使用 HashRouter，避免打包后 file 协议下的路径问题 */}
      <HashRouter>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<HomePage />} />
            {/* 工具路由由 src/tools 目录自动生成 */}
            {toolRoutes.map((route) => (
              <Route key={route.id} path={route.path} element={route.element} />
            ))}
            <Route path="settings" element={<SettingsPage />} />
            <Route path="about" element={<AboutPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </HashRouter>
      <Toaster />
    </ThemeProvider>
  );
}
