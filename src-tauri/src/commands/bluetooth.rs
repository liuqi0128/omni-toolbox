//! 蓝牙低功耗（BLE）扫描。
//!
//! 扫描跑在后台任务里，发现的设备通过 `bluetooth://device` 事件推送给前端，
//! 前端按 id 合并更新即可，无需轮询。
//!
//! 注意：btleplug 只能发现 **BLE** 设备（低功耗蓝牙）。经典蓝牙设备
//! （多数蓝牙耳机、音箱）不会出现在结果中。

use std::collections::HashMap;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant, SystemTime, UNIX_EPOCH};

use btleplug::api::{Central, CentralEvent, CentralState, Manager as _, Peripheral as _, ScanFilter};
use btleplug::platform::{Adapter, Manager};
use futures::StreamExt;
use serde::Serialize;
use tauri::{AppHandle, Emitter, State};

use crate::error::{AppError, AppResult};

/// 推送设备信息的事件名
const DEVICE_EVENT: &str = "bluetooth://device";
/// 扫描出错时的事件名
const ERROR_EVENT: &str = "bluetooth://error";
/// 同一设备的最小上报间隔，避免高频广播包刷屏
const REPORT_INTERVAL: Duration = Duration::from_millis(1000);
/// 事件流的轮询时间片，用于及时响应停止请求
const POLL_INTERVAL: Duration = Duration::from_millis(300);

fn ble_error(error: btleplug::Error) -> AppError {
    AppError::Internal(format!("蓝牙操作失败：{error}"))
}

fn lock_error() -> AppError {
    AppError::internal("蓝牙状态锁已损坏，请重启应用")
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BleDevice {
    /// 平台内部的稳定标识，前端用它去重
    pub id: String,
    /// 设备名，可能为空（部分设备不广播名称）
    pub name: Option<String>,
    /// MAC 地址
    pub address: String,
    /// 信号强度（dBm），越接近 0 越强
    pub rssi: Option<i16>,
    /// 广播中携带的服务 UUID
    pub services: Vec<String>,
    /// 最近一次发现的时间戳（毫秒）
    pub last_seen: u64,
}

/// 扫描状态，由 Tauri 托管
#[derive(Default)]
pub struct BluetoothState {
    /// 当前扫描任务的停止标志，为 None 表示未在扫描
    stopper: Mutex<Option<Arc<AtomicBool>>>,
}

impl BluetoothState {
    pub fn new() -> Self {
        Self::default()
    }

    fn is_scanning(&self) -> bool {
        self.stopper
            .lock()
            .map(|guard| guard.is_some())
            .unwrap_or(false)
    }
}

fn now_millis() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|value| value.as_millis() as u64)
        .unwrap_or(0)
}

/// 打开系统蓝牙适配器，并把不可用状态翻译成可读提示
async fn open_adapter() -> AppResult<Adapter> {
    let manager = Manager::new().await.map_err(ble_error)?;
    let adapters = manager.adapters().await.map_err(ble_error)?;

    let adapter = adapters
        .into_iter()
        .next()
        .ok_or_else(|| AppError::invalid("未找到蓝牙适配器，请确认设备具备蓝牙功能"))?;

    match adapter.adapter_state().await.map_err(ble_error)? {
        CentralState::PoweredOn => Ok(adapter),
        CentralState::PoweredOff => Err(AppError::invalid(
            "蓝牙已关闭，请在系统设置中开启蓝牙后重试",
        )),
        CentralState::Unknown => Err(AppError::invalid(
            "无法确定蓝牙状态，请确认系统蓝牙已开启，且系统设置中已允许本应用使用蓝牙",
        )),
    }
}

/// 后台扫描循环，直到停止标志被置位
async fn scan_loop(app: AppHandle, adapter: Adapter, stop: Arc<AtomicBool>) {
    let mut events = match adapter.events().await {
        Ok(stream) => stream,
        Err(error) => {
            let _ = app.emit(ERROR_EVENT, ble_error(error).to_string());
            let _ = adapter.stop_scan().await;
            return;
        }
    };

    let mut reported: HashMap<String, Instant> = HashMap::new();

    loop {
        if stop.load(Ordering::Relaxed) {
            break;
        }

        match tokio::time::timeout(POLL_INTERVAL, events.next()).await {
            Ok(Some(event)) => {
                let id = match event {
                    CentralEvent::DeviceDiscovered(id) | CentralEvent::DeviceUpdated(id) => id,
                    _ => continue,
                };

                let Ok(peripheral) = adapter.peripheral(&id).await else {
                    continue;
                };
                let Ok(Some(properties)) = peripheral.properties().await else {
                    continue;
                };

                let key = format!("{id:?}");
                let now = Instant::now();
                if reported
                    .get(&key)
                    .is_some_and(|last| now.duration_since(*last) < REPORT_INTERVAL)
                {
                    continue;
                }
                reported.insert(key.clone(), now);

                let device = BleDevice {
                    id: key,
                    name: properties.local_name.or(properties.advertisement_name),
                    address: properties.address.to_string(),
                    rssi: properties.rssi,
                    services: properties
                        .services
                        .iter()
                        .map(|uuid| uuid.to_string())
                        .collect(),
                    last_seen: now_millis(),
                };

                if app.emit(DEVICE_EVENT, device).is_err() {
                    break;
                }
            }
            // 事件流结束
            Ok(None) => break,
            // 时间片走完，回到循环顶部检查停止标志
            Err(_) => {}
        }
    }

    let _ = adapter.stop_scan().await;
}

/// 列出本机蓝牙适配器信息
#[tauri::command]
pub async fn list_bluetooth_adapters() -> AppResult<Vec<String>> {
    let manager = Manager::new().await.map_err(ble_error)?;
    let adapters = manager.adapters().await.map_err(ble_error)?;

    let mut result = Vec::new();
    for adapter in adapters {
        result.push(adapter.adapter_info().await.map_err(ble_error)?);
    }

    Ok(result)
}

/// 开始扫描，重复调用会先停止上一次扫描
#[tauri::command]
pub async fn start_bluetooth_scan(
    app: AppHandle,
    state: State<'_, BluetoothState>,
) -> AppResult<()> {
    // 先停掉可能在跑的扫描
    if let Some(flag) = state.stopper.lock().map_err(|_| lock_error())?.take() {
        flag.store(true, Ordering::Relaxed);
    }

    let adapter = open_adapter().await?;
    adapter.start_scan(ScanFilter::default()).await.map_err(ble_error)?;

    let stop = Arc::new(AtomicBool::new(false));
    *state.stopper.lock().map_err(|_| lock_error())? = Some(Arc::clone(&stop));

    tauri::async_runtime::spawn(scan_loop(app, adapter, stop));

    Ok(())
}

/// 停止扫描；未在扫描时视为成功
#[tauri::command]
pub fn stop_bluetooth_scan(state: State<'_, BluetoothState>) -> AppResult<()> {
    if let Some(flag) = state.stopper.lock().map_err(|_| lock_error())?.take() {
        flag.store(true, Ordering::Relaxed);
    }

    Ok(())
}

/// 查询是否正在扫描
#[tauri::command]
pub fn bluetooth_scanning(state: State<'_, BluetoothState>) -> AppResult<bool> {
    Ok(state.is_scanning())
}
