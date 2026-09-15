//! 串口通信：枚举端口、开关连接、收发数据。
//!
//! 读取由独立线程负责，收到数据后通过 `serial://data` 事件推送给前端，
//! 这样可以避免前端轮询造成的延迟与空转。

use std::io::{Read, Write};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::thread::{self, JoinHandle};
use std::time::Duration;

use serde::{Deserialize, Serialize};
use serialport::{DataBits, FlowControl, Parity, SerialPort, SerialPortType, StopBits};
use tauri::{AppHandle, Emitter, State};

use crate::error::{AppError, AppResult};

/// 读取超时，决定读取线程响应停止信号的间隔
const READ_TIMEOUT: Duration = Duration::from_millis(50);

/// 推送给前端的数据事件名
const DATA_EVENT: &str = "serial://data";

impl From<serialport::Error> for AppError {
    fn from(error: serialport::Error) -> Self {
        AppError::Internal(format!("串口操作失败：{error}"))
    }
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PortInfo {
    pub name: String,
    /// 端口类型：USB / PCI / 蓝牙 / 未知
    pub kind: String,
    /// 可读描述，通常来自 USB 设备信息
    pub description: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SerialConfig {
    pub port: String,
    pub baud_rate: u32,
    pub data_bits: Option<u8>,
    pub stop_bits: Option<u8>,
    /// none / odd / even
    pub parity: Option<String>,
    /// none / software / hardware
    pub flow_control: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct SerialPayload {
    pub data: Vec<u8>,
}

struct OpenPort {
    port: Box<dyn SerialPort>,
    stop: Arc<AtomicBool>,
    reader: JoinHandle<()>,
}

/// 串口连接状态，由 Tauri 托管
#[derive(Default)]
pub struct SerialState {
    current: Mutex<Option<OpenPort>>,
}

impl SerialState {
    pub fn new() -> Self {
        Self::default()
    }
}

fn parse_data_bits(value: Option<u8>) -> AppResult<DataBits> {
    match value.unwrap_or(8) {
        5 => Ok(DataBits::Five),
        6 => Ok(DataBits::Six),
        7 => Ok(DataBits::Seven),
        8 => Ok(DataBits::Eight),
        other => Err(AppError::invalid(format!("不支持的数据位：{other}"))),
    }
}

fn parse_stop_bits(value: Option<u8>) -> AppResult<StopBits> {
    match value.unwrap_or(1) {
        1 => Ok(StopBits::One),
        2 => Ok(StopBits::Two),
        other => Err(AppError::invalid(format!("不支持的停止位：{other}"))),
    }
}

fn parse_parity(value: Option<&str>) -> AppResult<Parity> {
    match value.unwrap_or("none").to_lowercase().as_str() {
        "none" => Ok(Parity::None),
        "odd" => Ok(Parity::Odd),
        "even" => Ok(Parity::Even),
        other => Err(AppError::invalid(format!("不支持的校验位：{other}"))),
    }
}

fn parse_flow_control(value: Option<&str>) -> AppResult<FlowControl> {
    match value.unwrap_or("none").to_lowercase().as_str() {
        "none" => Ok(FlowControl::None),
        "software" => Ok(FlowControl::Software),
        "hardware" => Ok(FlowControl::Hardware),
        other => Err(AppError::invalid(format!("不支持的流控方式：{other}"))),
    }
}

/// 枚举当前系统可用的串口
#[tauri::command]
pub fn list_serial_ports() -> AppResult<Vec<PortInfo>> {
    let ports = serialport::available_ports()?;

    Ok(ports
        .into_iter()
        .map(|info| {
            let (kind, description) = match info.port_type {
                SerialPortType::UsbPort(usb) => {
                    let mut parts: Vec<String> = Vec::new();
                    if let Some(manufacturer) = usb.manufacturer {
                        parts.push(manufacturer);
                    }
                    if let Some(product) = usb.product {
                        parts.push(product);
                    }
                    parts.push(format!("{:04x}:{:04x}", usb.vid, usb.pid));
                    ("USB".to_string(), Some(parts.join(" · ")))
                }
                SerialPortType::PciPort => ("PCI".to_string(), None),
                SerialPortType::BluetoothPort => ("蓝牙".to_string(), None),
                SerialPortType::Unknown => ("未知".to_string(), None),
            };

            PortInfo {
                name: info.port_name,
                kind,
                description,
            }
        })
        .collect())
}

/// 打开串口并启动读取线程。若已有连接会先关闭。
#[tauri::command]
pub fn open_serial(
    app: AppHandle,
    state: State<'_, SerialState>,
    config: SerialConfig,
) -> AppResult<()> {
    if config.port.trim().is_empty() {
        return Err(AppError::invalid("请先选择串口"));
    }
    if config.baud_rate == 0 {
        return Err(AppError::invalid("波特率必须大于 0"));
    }

    close_port(&state)?;

    let mut port = serialport::new(&config.port, config.baud_rate)
        .data_bits(parse_data_bits(config.data_bits)?)
        .stop_bits(parse_stop_bits(config.stop_bits)?)
        .parity(parse_parity(config.parity.as_deref())?)
        .flow_control(parse_flow_control(config.flow_control.as_deref())?)
        .timeout(READ_TIMEOUT)
        .open()?;

    // 清空可能残留的输入缓冲
    let _ = port.clear(serialport::ClearBuffer::Input);

    let mut reader = port.try_clone()?;
    let stop = Arc::new(AtomicBool::new(false));
    let stop_flag = Arc::clone(&stop);
    let handle = app.clone();

    let reader_thread = thread::spawn(move || {
        let mut buffer = [0u8; 2048];

        while !stop_flag.load(Ordering::Relaxed) {
            match reader.read(&mut buffer) {
                Ok(0) => {}
                Ok(size) => {
                    let payload = SerialPayload {
                        data: buffer[..size].to_vec(),
                    };
                    if handle.emit(DATA_EVENT, payload).is_err() {
                        break;
                    }
                }
                // 读取超时属正常情况，继续等待
                Err(ref error) if error.kind() == std::io::ErrorKind::TimedOut => {}
                Err(ref error) if error.kind() == std::io::ErrorKind::Interrupted => {}
                // 设备被拔出或端口被关闭，结束读取
                Err(_) => break,
            }
        }
    });

    let mut guard = state
        .current
        .lock()
        .map_err(|_| AppError::internal("串口状态锁已损坏，请重启应用"))?;

    *guard = Some(OpenPort {
        port,
        stop,
        reader: reader_thread,
    });

    Ok(())
}

/// 关闭当前连接；未打开时视为成功
fn close_port(state: &State<'_, SerialState>) -> AppResult<()> {
    let mut guard = state
        .current
        .lock()
        .map_err(|_| AppError::internal("串口状态锁已损坏，请重启应用"))?;

    if let Some(open) = guard.take() {
        open.stop.store(true, Ordering::Relaxed);
        // 等待读取线程退出，避免端口被占用
        let _ = open.reader.join();
    }

    Ok(())
}

#[tauri::command]
pub fn close_serial(state: State<'_, SerialState>) -> AppResult<()> {
    close_port(&state)
}

#[tauri::command]
pub fn serial_is_open(state: State<'_, SerialState>) -> AppResult<bool> {
    let guard = state
        .current
        .lock()
        .map_err(|_| AppError::internal("串口状态锁已损坏，请重启应用"))?;

    Ok(guard.is_some())
}

/// 写入数据，返回实际写入的字节数
#[tauri::command]
pub fn write_serial(state: State<'_, SerialState>, data: Vec<u8>) -> AppResult<usize> {
    if data.is_empty() {
        return Err(AppError::invalid("发送内容不能为空"));
    }

    let mut guard = state
        .current
        .lock()
        .map_err(|_| AppError::internal("串口状态锁已损坏，请重启应用"))?;

    let open = guard
        .as_mut()
        .ok_or_else(|| AppError::invalid("串口尚未打开"))?;

    open.port.write_all(&data)?;
    open.port.flush()?;

    Ok(data.len())
}
