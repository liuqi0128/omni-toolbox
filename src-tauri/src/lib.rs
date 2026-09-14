//! 万象工具箱后端入口。
//!
//! 分层约定：
//! - `commands/` 只做参数校验与结果组装，按领域拆分；
//! - `error.rs` 统一错误形态，序列化后交给前端展示；
//! - `state.rs` 存放跨命令共享的运行期状态。

mod commands;
mod error;
mod state;

pub use error::{AppError, AppResult};
pub use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState::new())
        .invoke_handler(tauri::generate_handler![
            commands::crypto::hash_text,
            commands::generator::generate_uuids,
            commands::system::system_info,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
