use uuid::Uuid;

use crate::error::{AppError, AppResult};

const MAX_COUNT: usize = 1000;

/// 批量生成 UUID。
///
/// - `kind`：`v4`（随机）或 `v7`（按时间有序，默认）
/// - `upper`：输出是否转为大写
/// - `hyphen`：是否保留连字符
#[tauri::command]
pub fn generate_uuids(
    count: usize,
    kind: Option<String>,
    upper: Option<bool>,
    hyphen: Option<bool>,
) -> AppResult<Vec<String>> {
    if count == 0 || count > MAX_COUNT {
        return Err(AppError::invalid(format!(
            "生成数量需在 1 ~ {MAX_COUNT} 之间"
        )));
    }

    let kind = kind.unwrap_or_else(|| "v7".to_string()).to_lowercase();
    if kind != "v4" && kind != "v7" {
        return Err(AppError::invalid(format!("不支持的 UUID 版本：{kind}")));
    }

    let upper = upper.unwrap_or(false);
    let hyphen = hyphen.unwrap_or(true);
    let mut result = Vec::with_capacity(count);

    for _ in 0..count {
        let raw = if kind == "v4" {
            Uuid::new_v4()
        } else {
            Uuid::now_v7()
        };

        let text = if hyphen {
            raw.hyphenated().to_string()
        } else {
            raw.simple().to_string()
        };

        result.push(if upper { text.to_uppercase() } else { text });
    }

    Ok(result)
}
