//! 命令层：按领域拆分模块，每个模块只负责参数校验与结果组装。
//!
//! 新增命令的步骤：
//! 1. 在对应领域模块中编写 `#[tauri::command]` 函数；
//! 2. 在 `crate::run()` 的 `generate_handler!` 中登记；
//! 3. 前端通过 `@/lib/ipc` 的 `call()` 调用。

pub mod crypto;
pub mod generator;
pub mod serial;
pub mod system;
