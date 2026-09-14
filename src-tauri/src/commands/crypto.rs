use md5::Md5;
use serde::Serialize;
use sha1::Sha1;
use sha2::{Digest, Sha256, Sha512};

/// 一次返回全部摘要，避免多次跨端往返。
#[derive(Debug, Serialize)]
pub struct DigestSet {
    pub md5: String,
    pub sha1: String,
    pub sha256: String,
    pub sha512: String,
}

#[tauri::command]
pub fn hash_text(text: String) -> DigestSet {
    DigestSet {
        md5: hex::encode(Md5::digest(text.as_bytes())),
        sha1: hex::encode(Sha1::digest(text.as_bytes())),
        sha256: hex::encode(Sha256::digest(text.as_bytes())),
        sha512: hex::encode(Sha512::digest(text.as_bytes())),
    }
}
