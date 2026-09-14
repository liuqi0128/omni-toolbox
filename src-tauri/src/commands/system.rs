use serde::Serialize;
use tauri::State;

use crate::error::AppResult;
use crate::state::AppState;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SystemInfo {
    /// 后端 crate 版本
    pub backend_version: String,
    /// 操作系统标识，如 windows / macos / linux
    pub os: String,
    /// 系统家族，如 windows / unix
    pub os_family: String,
    /// CPU 架构，如 x86_64 / aarch64
    pub arch: String,
    /// 计算机名
    pub hostname: String,
    /// 逻辑核心数
    pub cpu_cores: usize,
    /// 进程已运行秒数
    pub runtime_seconds: u64,
    /// 可执行文件路径
    pub exe_path: String,
    /// 工作目录
    pub working_dir: String,
    /// 是否为 debug 构建
    pub debug_build: bool,
}

fn hostname() -> String {
    std::env::var("COMPUTERNAME")
        .or_else(|_| std::env::var("HOSTNAME"))
        .unwrap_or_else(|_| "未知主机".to_string())
}

/// 汇总宿主环境信息，供“系统信息”工具展示。
#[tauri::command]
pub fn system_info(state: State<'_, AppState>) -> AppResult<SystemInfo> {
    let cpu_cores = std::thread::available_parallelism()
        .map(|value| value.get())
        .unwrap_or(1);

    Ok(SystemInfo {
        backend_version: env!("CARGO_PKG_VERSION").to_string(),
        os: std::env::consts::OS.to_string(),
        os_family: std::env::consts::FAMILY.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        hostname: hostname(),
        cpu_cores,
        runtime_seconds: state.uptime_seconds(),
        exe_path: std::env::current_exe()
            .map(|path| path.display().to_string())
            .unwrap_or_else(|_| "未知".to_string()),
        working_dir: std::env::current_dir()
            .map(|path| path.display().to_string())
            .unwrap_or_else(|_| "未知".to_string()),
        debug_build: cfg!(debug_assertions),
    })
}
