/**
 * 行级差异计算。基于最长公共子序列（LCS）回溯得到逐行结果，
 * 只做文本对比，不依赖任何后端能力。
 */

export type DiffKind = "equal" | "add" | "remove";

export interface DiffLine {
  kind: DiffKind;
  /** 左侧行号，新增行时为 null */
  leftNo: number | null;
  /** 右侧行号，删除行时为 null */
  rightNo: number | null;
  text: string;
}

export interface DiffOptions {
  /** 比较时忽略大小写 */
  ignoreCase: boolean;
  /** 比较时忽略行首尾空白 */
  ignoreTrailingWhitespace: boolean;
}

export interface DiffStats {
  added: number;
  removed: number;
  unchanged: number;
}

/**
 * LCS 矩阵的单元格上限（约 2000 × 2000）。
 * 超过则拒绝计算，避免大文件把主线程卡死。
 */
export const DIFF_LIMIT_CELLS = 4_000_000;

/**
 * 两侧文本的字符总量上限（含两端）。
 * 行数检查拦不住「行很少但每行极长」的输入 —— 二进制文件被按文本解码后
 * 正是这种形态，所以必须再按字符数兜一道。
 */
export const DIFF_LIMIT_CHARS = 1_000_000;

/** 统一换行符并切分为行数组；结尾的换行不算作额外一行 */
export function splitLines(text: string): string[] {
  if (text === "") return [];

  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

/** 按选项归一化，仅用于比较，不影响展示内容 */
function normalize(line: string, options: DiffOptions): string {
  let value = options.ignoreTrailingWhitespace ? line.trim() : line;
  if (options.ignoreCase) value = value.toLowerCase();
  return value;
}

/**
 * 把各行归一化后映射为整数 ID。
 * DP 中只比较数字，避免对超长行做逐字符比较（那是二进制内容卡死的主因）。
 *
 * 注意：两侧必须共用同一个 dictionary，否则同一 ID 在左右两侧会指向不同的行，
 * 导致截然不同的内容被判为相同。
 */
function internKeys(
  lines: string[],
  options: DiffOptions,
  dictionary: Map<string, number>,
): Uint32Array {
  const keys = new Uint32Array(lines.length);

  for (let index = 0; index < lines.length; index += 1) {
    const normalized = normalize(lines[index], options);
    let id = dictionary.get(normalized);

    if (id === undefined) {
      id = dictionary.size;
      dictionary.set(normalized, id);
    }

    keys[index] = id;
  }

  return keys;
}

export function diffLines(left: string, right: string, options: DiffOptions): DiffLine[] {
  const leftLines = splitLines(left);
  const rightLines = splitLines(right);
  const dictionary = new Map<string, number>();
  const leftKeys = internKeys(leftLines, options, dictionary);
  const rightKeys = internKeys(rightLines, options, dictionary);

  const rows = leftLines.length;
  const columns = rightLines.length;

  // dp[i][j] = leftKeys[i..] 与 rightKeys[j..] 的最长公共子序列长度
  const dp: Uint32Array[] = Array.from({ length: rows + 1 }, () => new Uint32Array(columns + 1));

  for (let i = rows - 1; i >= 0; i -= 1) {
    for (let j = columns - 1; j >= 0; j -= 1) {
      dp[i][j] =
        leftKeys[i] === rightKeys[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const result: DiffLine[] = [];
  let i = 0;
  let j = 0;
  let leftNo = 1;
  let rightNo = 1;

  while (i < rows && j < columns) {
    if (leftKeys[i] === rightKeys[j]) {
      result.push({ kind: "equal", leftNo, rightNo, text: leftLines[i] });
      leftNo += 1;
      rightNo += 1;
      i += 1;
      j += 1;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      result.push({ kind: "remove", leftNo, rightNo: null, text: leftLines[i] });
      leftNo += 1;
      i += 1;
    } else {
      result.push({ kind: "add", leftNo: null, rightNo, text: rightLines[j] });
      rightNo += 1;
      j += 1;
    }
  }

  while (i < rows) {
    result.push({ kind: "remove", leftNo, rightNo: null, text: leftLines[i] });
    leftNo += 1;
    i += 1;
  }

  while (j < columns) {
    result.push({ kind: "add", leftNo: null, rightNo, text: rightLines[j] });
    rightNo += 1;
    j += 1;
  }

  return result;
}

export function summarize(lines: DiffLine[]): DiffStats {
  return lines.reduce<DiffStats>(
    (stats, line) => {
      if (line.kind === "add") stats.added += 1;
      else if (line.kind === "remove") stats.removed += 1;
      else stats.unchanged += 1;
      return stats;
    },
    { added: 0, removed: 0, unchanged: 0 },
  );
}

/** 并排视图的一行：左右各自可能为空（该侧没有对应行） */
export interface SideBySideRow {
  left: DiffLine | null;
  right: DiffLine | null;
}

/**
 * 把逐行结果折叠成左右并排的行对。
 * 同一段连续的删除与新增会被配对到同一行，多出的一侧留空。
 */
export function toSideBySide(lines: DiffLine[]): SideBySideRow[] {
  const rows: SideBySideRow[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.kind === "equal") {
      rows.push({ left: line, right: line });
      index += 1;
      continue;
    }

    // 收集一整段变动行（可能以删除或新增开头，也可能交替）
    const removed: DiffLine[] = [];
    const added: DiffLine[] = [];

    while (index < lines.length && lines[index].kind !== "equal") {
      const current = lines[index];
      if (current.kind === "remove") removed.push(current);
      else added.push(current);
      index += 1;
    }

    const count = Math.max(removed.length, added.length);
    for (let offset = 0; offset < count; offset += 1) {
      rows.push({ left: removed[offset] ?? null, right: added[offset] ?? null });
    }
  }

  return rows;
}
