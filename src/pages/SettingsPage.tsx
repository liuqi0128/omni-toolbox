import { ClipboardClock, RotateCcw, Settings2, Star } from "lucide-react";

import {
  Alert,
  Button,
  Panel as PanelBox,
  PanelBody,
  PanelHead,
  Segmented,
  Switch,
} from "@/components/ui";
import { useFavoritesStore } from "@/features/favorites/store";
import { useHistoryStore } from "@/features/history/store";
import { useSettingsStore } from "@/features/settings/store";
import { useThemeStore, THEME_OPTIONS } from "@/features/theme/store";
import { toast } from "@/features/toast/store";

export function SettingsPage() {
  const themeMode = useThemeStore((state) => state.mode);
  const setThemeMode = useThemeStore((state) => state.setMode);

  const sidebarCollapsed = useSettingsStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useSettingsStore((state) => state.toggleSidebar);
  const collapsedGroups = useSettingsStore((state) => state.collapsedGroups);
  const resetSettings = useSettingsStore((state) => state.reset);

  const favoriteIds = useFavoritesStore((state) => state.ids);
  const clearFavorites = useFavoritesStore((state) => state.clear);
  const historyIds = useHistoryStore((state) => state.ids);
  const clearHistory = useHistoryStore((state) => state.clear);

  return (
    <div className="ot-page-scroll">
      <div className="ot-doc">
        <PanelBox>
          <PanelHead title="外观" icon={<Settings2 size={14} />} />
          <PanelBody>
            <div className="ot-settingrow">
              <div className="ot-settingrow__info">
                <div className="ot-settingrow__title">主题模式</div>
                <div className="ot-settingrow__desc">
                  跟随系统时会随操作系统的深浅色设置自动切换。
                </div>
              </div>
              <div className="ot-settingrow__control">
                <Segmented value={themeMode} options={THEME_OPTIONS} onValueChange={setThemeMode} />
              </div>
            </div>

            <div className="ot-settingrow">
              <div className="ot-settingrow__info">
                <div className="ot-settingrow__title">默认折叠侧边栏</div>
                <div className="ot-settingrow__desc">折叠后仅保留图标，为内容区腾出更多空间。</div>
              </div>
              <div className="ot-settingrow__control">
                <Switch checked={sidebarCollapsed} onCheckedChange={toggleSidebar} />
              </div>
            </div>
          </PanelBody>
        </PanelBox>

        <PanelBox>
          <PanelHead title="数据" icon={<ClipboardClock size={14} />} />
          <PanelBody>
            <div className="ot-settingrow">
              <div className="ot-settingrow__info">
                <div className="ot-settingrow__title">
                  <Star size={13} /> 收藏的工具
                </div>
                <div className="ot-settingrow__desc">
                  当前共 {favoriteIds.length} 个收藏，保存在本机浏览器存储中。
                </div>
              </div>
              <div className="ot-settingrow__control">
                <Button
                  size="sm"
                  variant="danger"
                  disabled={favoriteIds.length === 0}
                  onClick={() => {
                    clearFavorites();
                    toast.success("已清空收藏");
                  }}
                >
                  清空
                </Button>
              </div>
            </div>

            <div className="ot-settingrow">
              <div className="ot-settingrow__info">
                <div className="ot-settingrow__title">最近使用</div>
                <div className="ot-settingrow__desc">
                  当前记录 {historyIds.length} 条，用于命令面板的排序。
                </div>
              </div>
              <div className="ot-settingrow__control">
                <Button
                  size="sm"
                  variant="danger"
                  disabled={historyIds.length === 0}
                  onClick={() => {
                    clearHistory();
                    toast.success("已清空最近使用");
                  }}
                >
                  清空
                </Button>
              </div>
            </div>

            <div className="ot-settingrow">
              <div className="ot-settingrow__info">
                <div className="ot-settingrow__title">重置界面偏好</div>
                <div className="ot-settingrow__desc">
                  恢复侧边栏与分组折叠状态（已折叠分组 {collapsedGroups.length} 个）。
                </div>
              </div>
              <div className="ot-settingrow__control">
                <Button
                  size="sm"
                  icon={<RotateCcw size={13} />}
                  onClick={() => {
                    resetSettings();
                    toast.success("已重置界面偏好");
                  }}
                >
                  重置
                </Button>
              </div>
            </div>
          </PanelBody>
        </PanelBox>

        <PanelBox>
          <PanelHead title="快捷键" />
          <PanelBody>
            <div className="ot-inline">
              <span className="ot-kbd">Ctrl</span>
              <span className="ot-kbd">K</span>
              <span className="ot-muted">打开命令面板，快速跳转到任意工具</span>
            </div>
            <div className="ot-inline" style={{ marginTop: "var(--ot-space-3)" }}>
              <span className="ot-kbd">Esc</span>
              <span className="ot-muted">关闭命令面板</span>
            </div>
          </PanelBody>
        </PanelBox>

        <Alert variant="info">所有偏好与收藏均保存在本机，不会上传到任何服务器。</Alert>
      </div>
    </div>
  );
}
