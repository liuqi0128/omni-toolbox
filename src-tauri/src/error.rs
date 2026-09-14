use std::fmt;

use serde::{Serialize, Serializer};

/// 应用统一错误类型。
///
/// 命令一律返回 `AppResult<T>`，错误经由 `Serialize` 转成字符串抛给前端，
/// 前端 `IpcError` 会把它包装成可展示的 message。
#[derive(Debug, Clone)]
pub enum AppError {
    /// 调用方传入了不合法或无法处理的参数
    InvalidInput(String),
    /// 内部执行失败
    Internal(String),
}

impl AppError {
    pub fn invalid(message: impl Into<String>) -> Self {
        Self::InvalidInput(message.into())
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::Internal(message.into())
    }
}

impl fmt::Display for AppError {
    fn fmt(&self, formatter: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidInput(message) => write!(formatter, "{message}"),
            Self::Internal(message) => write!(formatter, "{message}"),
        }
    }
}

impl std::error::Error for AppError {}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(error: std::io::Error) -> Self {
        Self::Internal(format!("IO 操作失败：{error}"))
    }
}

pub type AppResult<T> = Result<T, AppError>;
