const PREFIX = "omni-toolbox:";

function withPrefix(key: string): string {
  return `${PREFIX}${key}`;
}

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(withPrefix(key));
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(withPrefix(key), JSON.stringify(value));
  } catch {
    // 存储写入失败（隐私模式 / 配额）时静默降级，不影响功能
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(withPrefix(key));
  } catch {
    // 同上
  }
}

/** 生成带前缀的存储键，供 zustand persist 使用 */
export function storageKey(key: string): string {
  return withPrefix(key);
}
