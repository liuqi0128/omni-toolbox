import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Cable,
  Eraser,
  Plug,
  RefreshCw,
  Send,
  Unplug,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Panel,
  PanelBody,
  PanelHead,
  Segmented,
  Select,
  Switch,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { call, isTauriRuntime, toMessage } from "@/lib/ipc";
import type { ToolModule } from "@/tools/types";

/** 接收事件名，与后端 serial.rs 保持一致 */
const DATA_EVENT = "serial://data";
/** 日志条数上限，避免长时间运行占满内存 */
const MAX_LOGS = 500;

interface PortInfo {
  name: string;
  kind: string;
  description: string | null;
}

type DataMode = "text" | "hex";
type LogKind = "sent" | "received" | "system" | "error";

interface LogEntry {
  id: number;
  kind: LogKind;
  time: string;
  /** 原始字节，切换显示模式时重新格式化 */
  bytes: number[];
  /** 系统提示文本（非数据帧） */
  note?: string;
}

const BAUD_RATES = ["9600", "19200", "38400", "57600", "115200", "230400", "460800", "921600"];
const DATA_BITS = ["5", "6", "7", "8"];
const STOP_BITS = ["1", "2"];
const PARITIES = [
  { value: "none", label: "无校验" },
  { value: "odd", label: "奇校验" },
  { value: "even", label: "偶校验" },
];
const MODE_OPTIONS: { value: DataMode; label: string }[] = [
  { value: "text", label: "文本" },
  { value: "hex", label: "HEX" },
];

function toOptions(values: string[]): { value: string; label: string }[] {
  return values.map((value) => ({ value, label: value }));
}

/** 按当前显示模式格式化字节 */
function formatBytes(bytes: number[], mode: DataMode): string {
  if (bytes.length === 0) return "";
  if (mode === "hex") {
    return bytes.map((byte) => byte.toString(16).padStart(2, "0").toUpperCase()).join(" ");
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
}

/** 把输入框内容解析为待发送字节，解析失败时抛出带说明的错误 */
function encodeInput(input: string, mode: DataMode, appendNewline: boolean): number[] {
  if (!input) return [];

  if (mode === "hex") {
    const cleaned = input.replace(/[\s,]/g, "");
    if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
      throw new Error("HEX 模式只允许 0-9、A-F 以及空格分隔符");
    }
    if (cleaned.length % 2 !== 0) {
      throw new Error("HEX 字符个数必须为偶数");
    }

    const bytes: number[] = [];
    for (let index = 0; index < cleaned.length; index += 2) {
      bytes.push(Number.parseInt(cleaned.slice(index, index + 2), 16));
    }
    return bytes;
  }

  const bytes = Array.from(new TextEncoder().encode(input));
  if (appendNewline) bytes.push(0x0a);
  return bytes;
}

function SerialTool() {
  const [ports, setPorts] = useState<PortInfo[]>([]);
  const [port, setPort] = useState("");
  const [baudRate, setBaudRate] = useState("115200");
  const [dataBits, setDataBits] = useState("8");
  const [stopBits, setStopBits] = useState("1");
  const [parity, setParity] = useState("none");

  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [viewMode, setViewMode] = useState<DataMode>("text");
  const [sendMode, setSendMode] = useState<DataMode>("text");
  const [input, setInput] = useState("");
  const [appendNewline, setAppendNewline] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  const logIdRef = useRef(0);
  const logRef = useRef<HTMLDivElement>(null);

  const appendLog = useCallback((kind: LogKind, bytes: number[], note?: string) => {
    const time = new Date().toLocaleTimeString("zh-CN", { hour12: false });
    setLogs((current) => {
      const next = [...current, { id: (logIdRef.current += 1), kind, time, bytes, note }];
      return next.length > MAX_LOGS ? next.slice(next.length - MAX_LOGS) : next;
    });
  }, []);

  /** 写入端口列表，尽量保留当前选择 */
  const applyPorts = useCallback((list: PortInfo[]) => {
    setPorts(list);
    setError(null);
    setPort((current) =>
      current && list.some((item) => item.name === current) ? current : (list[0]?.name ?? ""),
    );
  }, []);

  /** 手动刷新（供按钮调用） */
  const refreshPorts = useCallback(async () => {
    try {
      applyPorts(await call<PortInfo[]>("list_serial_ports"));
    } catch (cause) {
      setError(toMessage(cause));
    }
  }, [applyPorts]);

  // 首次进入时枚举端口。状态更新都在 Promise 回调中，避免在 effect 内同步触发渲染
  useEffect(() => {
    if (!isTauriRuntime()) return;

    call<PortInfo[]>("list_serial_ports")
      .then(applyPorts)
      .catch((cause: unknown) => setError(toMessage(cause)));
  }, [applyPorts]);

  // 监听后端推送的串口数据
  useEffect(() => {
    if (!isTauriRuntime()) return undefined;

    let disposed = false;
    let unlisten: UnlistenFn | undefined;

    void listen<{ data: number[] }>(DATA_EVENT, (event) => {
      appendLog("received", event.payload.data);
    }).then((stop) => {
      if (disposed) stop();
      else unlisten = stop;
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [appendLog]);

  // 自动滚动到底部
  useEffect(() => {
    if (!autoScroll) return;
    const node = logRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [logs, autoScroll]);

  const connect = async () => {
    setBusy(true);
    try {
      await call("open_serial", {
        config: {
          port,
          baudRate: Number(baudRate),
          dataBits: Number(dataBits),
          stopBits: Number(stopBits),
          parity,
          flowControl: "none",
        },
      });
      setConnected(true);
      setError(null);
      appendLog("system", [], `已连接 ${port} · ${baudRate} ${dataBits}${parity[0]}${stopBits}`);
    } catch (cause) {
      setConnected(false);
      setError(toMessage(cause));
      appendLog("error", [], toMessage(cause));
    } finally {
      setBusy(false);
    }
  };

  const disconnect = async () => {
    try {
      await call("close_serial");
      setError(null);
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setConnected(false);
      appendLog("system", [], "已断开连接");
    }
  };

  const send = async () => {
    let bytes: number[];

    try {
      bytes = encodeInput(input, sendMode, appendNewline);
    } catch (cause) {
      setError(toMessage(cause));
      return;
    }

    if (bytes.length === 0) {
      setError("发送内容不能为空");
      return;
    }

    try {
      await call<number>("write_serial", { data: bytes });
      setError(null);
      appendLog("sent", bytes);
    } catch (cause) {
      setError(toMessage(cause));
      appendLog("error", [], toMessage(cause));
    }
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      if (connected) void send();
    }
  };

  const portOptions = useMemo(
    () =>
      ports.length > 0
        ? ports.map((item) => ({
            value: item.name,
            label: item.description
              ? `${item.name} · ${item.description}`
              : `${item.name}（${item.kind}）`,
          }))
        : [{ value: "", label: "未检测到串口" }],
    [ports],
  );

  const stats = useMemo(() => {
    let sent = 0;
    let received = 0;

    for (const entry of logs) {
      if (entry.kind === "sent") sent += entry.bytes.length;
      else if (entry.kind === "received") received += entry.bytes.length;
    }

    return { sent, received };
  }, [logs]);

  const preview = useMemo(() => {
    if (!input) return null;
    try {
      return encodeInput(input, sendMode, appendNewline).length;
    } catch {
      return null;
    }
  }, [input, sendMode, appendNewline]);

  return (
    <div className="ot-serial-layout">
      <Panel>
        <PanelHead
          title="连接配置"
          icon={<Cable size={14} />}
          actions={
            <>
              <Badge variant={connected ? "success" : "default"}>
                {connected ? "已连接" : "未连接"}
              </Badge>
              <Button
                size="sm"
                icon={<RefreshCw size={13} />}
                disabled={connected}
                onClick={() => void refreshPorts()}
              >
                刷新端口
              </Button>
            </>
          }
        />
        <PanelBody>
          <div className="ot-serial-config">
            <div className="ot-field">
              <span className="ot-label">串口</span>
              <Select
                value={port}
                options={portOptions}
                onValueChange={setPort}
                disabled={connected || ports.length === 0}
              />
            </div>
            <div className="ot-field">
              <span className="ot-label">波特率</span>
              <Select
                value={baudRate}
                options={toOptions(BAUD_RATES)}
                onValueChange={setBaudRate}
                disabled={connected}
              />
            </div>
            <div className="ot-field">
              <span className="ot-label">数据位</span>
              <Select
                value={dataBits}
                options={toOptions(DATA_BITS)}
                onValueChange={setDataBits}
                disabled={connected}
              />
            </div>
            <div className="ot-field">
              <span className="ot-label">停止位</span>
              <Select
                value={stopBits}
                options={toOptions(STOP_BITS)}
                onValueChange={setStopBits}
                disabled={connected}
              />
            </div>
            <div className="ot-field">
              <span className="ot-label">校验位</span>
              <Select
                value={parity}
                options={PARITIES}
                onValueChange={setParity}
                disabled={connected}
              />
            </div>
            <div className="ot-field">
              <span className="ot-label">操作</span>
              <Button
                variant={connected ? "danger" : "primary"}
                icon={connected ? <Unplug size={14} /> : <Plug size={14} />}
                disabled={busy || (!connected && !port)}
                onClick={() => (connected ? void disconnect() : void connect())}
              >
                {connected ? "断开" : busy ? "连接中…" : "连接"}
              </Button>
            </div>
          </div>

          {error ? (
            <Alert variant="error" className="ot-serial-alert">
              {error}
            </Alert>
          ) : null}

          {!isTauriRuntime() ? (
            <Alert variant="warning" className="ot-serial-alert">
              串口能力由 Rust 后端提供，请通过 <code>pnpm tauri:dev</code> 启动桌面端使用。
            </Alert>
          ) : null}
        </PanelBody>
      </Panel>

      <Panel className="ot-serial-receive">
        <PanelHead
          title="接收区"
          icon={<ArrowDownToLine size={14} />}
          actions={
            <>
              <Badge variant="info">{stats.received} 字节</Badge>
              <Segmented value={viewMode} options={MODE_OPTIONS} onValueChange={setViewMode} />
              <Switch checked={autoScroll} onCheckedChange={setAutoScroll} label="自动滚动" />
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                icon={<Eraser size={13} />}
                title="清空"
                aria-label="清空"
                disabled={logs.length === 0}
                onClick={() => setLogs([])}
              />
            </>
          }
        />
        <PanelBody flush>
          {logs.length > 0 ? (
            <div className="ot-serial-log" ref={logRef}>
              {logs.map((entry) => (
                <div
                  key={entry.id}
                  className={cn("ot-serial-line", `ot-serial-line--${entry.kind}`)}
                >
                  <span className="ot-serial-time">{entry.time}</span>
                  <span className="ot-serial-text">
                    {entry.note ?? formatBytes(entry.bytes, viewMode)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<ArrowDownToLine size={20} />}
              title="暂无数据"
              description="连接串口后，收到的数据会实时显示在这里，可随时在文本与 HEX 之间切换。"
            />
          )}
        </PanelBody>
      </Panel>

      <Panel>
        <PanelHead
          title="发送区"
          icon={<ArrowUpFromLine size={14} />}
          actions={
            <>
              <Badge variant="brand">{stats.sent} 字节</Badge>
              <Segmented value={sendMode} options={MODE_OPTIONS} onValueChange={setSendMode} />
              <Switch checked={appendNewline} onCheckedChange={setAppendNewline} label="追加换行" />
              <span className="ot-hint">Ctrl + Enter 发送</span>
            </>
          }
        />
        <PanelBody>
          <div className="ot-serial-send">
            <Textarea
              mono
              className="ot-serial-input"
              value={input}
              placeholder={
                sendMode === "hex"
                  ? "HEX 模式，例：AA 55 01 0D"
                  : "输入要发送的指令，例：AT+VERSION?"
              }
              disabled={!connected}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleInputKeyDown}
            />
            <Button
              variant="primary"
              icon={<Send size={14} />}
              disabled={!connected || !input || preview === null}
              onClick={() => void send()}
            >
              发送
            </Button>
          </div>
          {preview !== null && input ? (
            <p className="ot-hint ot-serial-preview">将发送 {preview} 字节</p>
          ) : null}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "serial",
    name: "串口调试",
    description: "枚举并连接串口设备，收发指令，支持文本与 HEX 模式",
    category: "dev",
    icon: Cable,
    keywords: ["serial", "串口", "uart", "com", "调试", "指令", "hex"],
    order: 40,
  },
  component: SerialTool,
} satisfies ToolModule;
