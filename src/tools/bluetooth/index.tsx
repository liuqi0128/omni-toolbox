import { listen } from "@tauri-apps/api/event";
import type { UnlistenFn } from "@tauri-apps/api/event";
import { Bluetooth, BluetoothSearching, Eraser, Play, RefreshCw, Square } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Badge,
  Button,
  CopyButton,
  EmptyState,
  Panel,
  PanelBody,
  PanelHead,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import { call, isTauriRuntime, toMessage } from "@/lib/ipc";
import type { ToolModule } from "@/tools/types";

/** 与后端 bluetooth.rs 保持一致 */
const DEVICE_EVENT = "bluetooth://device";
const ERROR_EVENT = "bluetooth://error";

interface BleDevice {
  id: string;
  name: string | null;
  address: string;
  rssi: number | null;
  services: string[];
  lastSeen: number;
}

/** 把 RSSI 映射为 1~4 格信号强度 */
function signalLevel(rssi: number | null): number {
  if (rssi === null) return 0;
  if (rssi >= -55) return 4;
  if (rssi >= -70) return 3;
  if (rssi >= -85) return 2;
  return 1;
}

const BAR_HEIGHTS = ["h-1.5", "h-2.5", "h-3.5", "h-[18px]"];

function SignalBars({ rssi }: { rssi: number | null }) {
  const level = signalLevel(rssi);

  return (
    <span
      className="flex shrink-0 items-end gap-0.5"
      title={rssi === null ? "信号强度未知" : `${rssi} dBm`}
    >
      {BAR_HEIGHTS.map((height, index) => (
        <span
          key={height}
          className={cn("w-1 rounded-[1px]", height, index < level ? "bg-brand" : "bg-line-strong")}
        />
      ))}
    </span>
  );
}

function BluetoothTool() {
  const [adapters, setAdapters] = useState<string[]>([]);
  const [devices, setDevices] = useState<Map<string, BleDevice>>(() => new Map());
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAdapters = async () => {
    try {
      setAdapters(await call<string[]>("list_bluetooth_adapters"));
      setError(null);
    } catch (cause) {
      setError(toMessage(cause));
    }
  };

  // 首次进入时读取适配器信息。状态更新都在 Promise 回调中，避免在 effect 内同步触发渲染
  useEffect(() => {
    if (!isTauriRuntime()) return;

    call<string[]>("list_bluetooth_adapters")
      .then(setAdapters)
      .catch((cause: unknown) => setError(toMessage(cause)));
  }, []);

  // 订阅后端推送的设备与错误事件
  useEffect(() => {
    if (!isTauriRuntime()) return undefined;

    let disposed = false;
    const unlisteners: UnlistenFn[] = [];

    const register = (unlisten: UnlistenFn) => {
      if (disposed) unlisten();
      else unlisteners.push(unlisten);
    };

    void listen<BleDevice>(DEVICE_EVENT, (event) => {
      const device = event.payload;
      setDevices((current) => {
        const next = new Map(current);
        next.set(device.id, device);
        return next;
      });
    }).then(register);

    void listen<string>(ERROR_EVENT, (event) => {
      setError(event.payload);
      setScanning(false);
    }).then(register);

    return () => {
      disposed = true;
      unlisteners.forEach((unlisten) => unlisten());
    };
  }, []);

  const startScan = async () => {
    try {
      await call("start_bluetooth_scan");
      setScanning(true);
      setError(null);
    } catch (cause) {
      setScanning(false);
      setError(toMessage(cause));
    }
  };

  const stopScan = async () => {
    try {
      await call("stop_bluetooth_scan");
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setScanning(false);
    }
  };

  /** 信号强的排在前面，无信号的排在最后 */
  const sorted = useMemo(
    () =>
      [...devices.values()].sort(
        (a, b) => (b.rssi ?? Number.NEGATIVE_INFINITY) - (a.rssi ?? Number.NEGATIVE_INFINITY),
      ),
    [devices],
  );

  const named = sorted.filter((device) => device.name).length;

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <Panel className="shrink-0">
        <PanelHead
          title="扫描控制"
          icon={<Bluetooth size={14} />}
          actions={
            <>
              <Badge variant={scanning ? "success" : "default"}>
                {scanning ? "扫描中…" : "已停止"}
              </Badge>
              <Button
                size="sm"
                icon={<RefreshCw size={13} />}
                disabled={scanning}
                onClick={() => void loadAdapters()}
              >
                刷新适配器
              </Button>
            </>
          }
        />
        <PanelBody>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant={scanning ? "danger" : "primary"}
              icon={scanning ? <Square size={14} /> : <Play size={14} />}
              onClick={() => (scanning ? void stopScan() : void startScan())}
            >
              {scanning ? "停止扫描" : "开始扫描"}
            </Button>
            <span className="ot-hint">
              已发现 {sorted.length} 个设备，其中 {named} 个有名称
            </span>
          </div>

          {adapters.length > 0 ? (
            <p className="ot-hint mt-3">适配器：{adapters.join("　·　")}</p>
          ) : null}

          {error ? (
            <Alert variant="error" className="mt-3">
              {error}
            </Alert>
          ) : null}

          <Alert variant="info" className="mt-3">
            <span className="block">
              仅能发现 <strong>蓝牙低功耗（BLE）</strong> 设备，多数蓝牙耳机 /
              音箱属经典蓝牙，不会出现在列表中。
            </span>
            <span className="mt-1 block">
              Windows 上若扫描不到设备，请确认系统蓝牙已开启，并在「设置 → 隐私 →
              位置」中允许定位服务（系统将其用于 BLE 扫描）。
            </span>
          </Alert>

          {!isTauriRuntime() ? (
            <Alert variant="warning" className="mt-3">
              蓝牙能力由 Rust 后端提供，请通过 <code>pnpm tauri:dev</code> 启动桌面端使用。
            </Alert>
          ) : null}
        </PanelBody>
      </Panel>

      <Panel className="min-h-0 flex-1">
        <PanelHead
          title="发现的设备"
          icon={<BluetoothSearching size={14} />}
          actions={
            <>
              <Badge variant="brand">{sorted.length}</Badge>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                icon={<Eraser size={13} />}
                title="清空列表"
                aria-label="清空列表"
                disabled={devices.size === 0}
                onClick={() => setDevices(new Map())}
              />
            </>
          }
        />
        <PanelBody flush>
          {sorted.length > 0 ? (
            <div className="ot-list p-3">
              {sorted.map((device) => (
                <div className="ot-list__item" key={device.id}>
                  <SignalBars rssi={device.rssi} />

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-medium">
                        {device.name ?? "未知设备"}
                      </span>
                      {device.services.length > 0 ? (
                        <Badge variant="info" title={device.services.join("\n")}>
                          {device.services.length} 个服务
                        </Badge>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-fg-muted">
                      <span className="font-mono">{device.address}</span>
                      <span>{device.rssi === null ? "信号未知" : `${device.rssi} dBm`}</span>
                    </div>
                  </div>

                  <CopyButton value={device.address} label="复制地址" iconOnly />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<BluetoothSearching size={20} />}
              title={scanning ? "正在搜索…" : "暂无设备"}
              description={
                scanning
                  ? "保持设备处于广播状态，发现的设备会实时出现在这里。"
                  : "点击「开始扫描」搜索周围的蓝牙低功耗设备。"
              }
            />
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "bluetooth",
    name: "蓝牙扫描",
    description: "搜索周围蓝牙低功耗（BLE）设备，查看信号强度与广播服务",
    category: "system",
    icon: Bluetooth,
    keywords: ["bluetooth", "蓝牙", "ble", "扫描", "搜索", "设备", "广播"],
    order: 20,
  },
  component: BluetoothTool,
} satisfies ToolModule;
