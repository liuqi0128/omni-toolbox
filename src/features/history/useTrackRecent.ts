import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useHistoryStore } from "./store";

const TOOL_PREFIX = "/tool/";

/**
 * 记录最近打开的工具，供命令面板排序使用。
 * 挂在应用外壳上即可覆盖全部工具页。
 */
export function useTrackRecent() {
  const location = useLocation();
  const push = useHistoryStore((state) => state.push);

  useEffect(() => {
    if (!location.pathname.startsWith(TOOL_PREFIX)) return;

    const id = location.pathname.slice(TOOL_PREFIX.length);
    if (id) push(id);
  }, [location.pathname, push]);
}
