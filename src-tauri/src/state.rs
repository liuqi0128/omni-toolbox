use std::time::Instant;

/// 全局共享状态，通过 `tauri::Builder::manage` 注入，
/// 命令中以 `State<'_, AppState>` 参数获取。
pub struct AppState {
    started_at: Instant,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            started_at: Instant::now(),
        }
    }

    /// 进程已运行的秒数
    pub fn uptime_seconds(&self) -> u64 {
        self.started_at.elapsed().as_secs()
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
