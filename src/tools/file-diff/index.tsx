import { CircleCheck, Eraser, FileText, GitCompare, Upload } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { DragEvent, ReactNode } from "react";

import {
  Alert,
  Badge,
  Button,
  CopyButton,
  EmptyState,
  Panel,
  PanelBody,
  PanelHead,
  Switch,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/cn";
import type { ToolModule } from "@/tools/types";

import { diffLines, DIFF_LIMIT_CELLS, splitLines, summarize, toSideBySide } from "./diff";
import type { DiffOptions } from "./diff";

interface FileInputPanelProps {
  title: string;
  fileName: string;
  value: string;
  onFile: (file: File) => void;
  onChange: (value: string) => void;
  onClear: () => void;
}

function FileInputPanel({
  title,
  fileName,
  value,
  onFile,
  onChange,
  onClear,
}: FileInputPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) onFile(file);
  };

  return (
    <Panel>
      <PanelHead
        title={title}
        icon={<FileText size={14} />}
        actions={
          <>
            {fileName ? <Badge variant="brand">{fileName}</Badge> : null}
            <Button size="sm" icon={<Upload size={13} />} onClick={() => inputRef.current?.click()}>
              选择文件
            </Button>
            <Button
              size="sm"
              variant="ghost"
              iconOnly
              icon={<Eraser size={13} />}
              title="清空"
              aria-label="清空"
              disabled={!value}
              onClick={onClear}
            />
          </>
        }
      />
      <PanelBody>
        <input
          ref={inputRef}
          type="file"
          hidden
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onFile(file);
            // 重置以便再次选择同一个文件
            event.target.value = "";
          }}
        />
        <div
          className={cn("ot-diff-drop", dragging && "ot-diff-drop--active")}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            // 移入子元素同样会触发 dragleave，仅在真正离开容器时取消高亮
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setDragging(false);
            }
          }}
          onDrop={handleDrop}
        >
          <Textarea
            mono
            value={value}
            placeholder="拖拽文件到此处，或点击右上角选择文件，也可以直接粘贴文本"
            style={{ minHeight: 150 }}
            onChange={(event) => onChange(event.target.value)}
          />
        </div>
      </PanelBody>
    </Panel>
  );
}

function FileDiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [leftName, setLeftName] = useState("");
  const [rightName, setRightName] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [ignoreWhitespace, setIgnoreWhitespace] = useState(false);
  const [onlyDiff, setOnlyDiff] = useState(false);

  const result = useMemo(() => {
    if (!left && !right) return { state: "empty" as const };

    const options: DiffOptions = {
      ignoreCase,
      ignoreTrailingWhitespace: ignoreWhitespace,
    };

    const leftCount = splitLines(left).length;
    const rightCount = splitLines(right).length;

    if (leftCount * rightCount > DIFF_LIMIT_CELLS) {
      return { state: "too-large" as const, leftCount, rightCount };
    }

    const lines = diffLines(left, right, options);
    return { state: "ok" as const, lines, stats: summarize(lines) };
  }, [left, right, ignoreCase, ignoreWhitespace]);

  /** 左右并排的行对；「仅显示差异」时过滤掉两侧都未变动的行 */
  const rows = useMemo(() => {
    if (result.state !== "ok") return [];
    const paired = toSideBySide(result.lines);
    return onlyDiff ? paired.filter((row) => row.left?.kind !== "equal") : paired;
  }, [result, onlyDiff]);

  /** 导出为 unified diff 文本，便于直接粘贴到 patch */
  const exportText = useMemo(() => {
    if (result.state !== "ok") return "";
    return result.lines
      .filter((line) => (onlyDiff ? line.kind !== "equal" : true))
      .map(
        (line) => `${line.kind === "add" ? "+" : line.kind === "remove" ? "-" : " "}${line.text}`,
      )
      .join("\n");
  }, [result, onlyDiff]);

  const readFile = async (file: File, apply: (text: string, name: string) => void) => {
    try {
      apply(await file.text(), file.name);
    } catch {
      apply("", file.name);
    }
  };

  const identical = result.state === "ok" && result.stats.added === 0 && result.stats.removed === 0;

  let body: ReactNode;

  if (result.state === "empty") {
    body = (
      <div className="ot-diff-message">
        <EmptyState
          icon={<GitCompare size={20} />}
          title="等待两份内容"
          description="在两个输入区分别选择文件、拖拽文件或粘贴文本，这里会逐行展示差异。"
        />
      </div>
    );
  } else if (result.state === "too-large") {
    body = (
      <div className="ot-diff-message">
        <Alert variant="warning">
          内容过大（左侧 {result.leftCount} 行 × 右侧 {result.rightCount}{" "}
          行），逐行对比会占用过多内存。 请先裁剪到 2000 行以内再试。
        </Alert>
      </div>
    );
  } else if (identical || rows.length === 0) {
    body = (
      <div className="ot-diff-message">
        <EmptyState
          icon={<CircleCheck size={20} />}
          title={identical ? "两份内容完全一致" : "没有差异行"}
          description="未发现新增或删除的行。"
        />
      </div>
    );
  } else {
    body = (
      <div className="ot-diff-rows">
        {rows.map((row, index) => (
          <div className="ot-diff-split" key={index}>
            <div
              className={cn(
                "ot-diff-cell",
                !row.left && "ot-diff-cell--empty",
                row.left?.kind === "remove" && "ot-diff-cell--remove",
              )}
            >
              <span className="ot-diff-no">{row.left?.leftNo ?? ""}</span>
              <span className="ot-diff-text">{row.left?.text || " "}</span>
            </div>
            <div
              className={cn(
                "ot-diff-cell",
                !row.right && "ot-diff-cell--empty",
                row.right?.kind === "add" && "ot-diff-cell--add",
              )}
            >
              <span className="ot-diff-no">{row.right?.rightNo ?? ""}</span>
              <span className="ot-diff-text">{row.right?.text || " "}</span>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="ot-diff-layout">
      <div className="ot-diff-inputs">
        <FileInputPanel
          title="原始内容"
          fileName={leftName}
          value={left}
          onFile={(file) =>
            void readFile(file, (text, name) => {
              setLeft(text);
              setLeftName(name);
            })
          }
          onChange={setLeft}
          onClear={() => {
            setLeft("");
            setLeftName("");
          }}
        />
        <FileInputPanel
          title="对比内容"
          fileName={rightName}
          value={right}
          onFile={(file) =>
            void readFile(file, (text, name) => {
              setRight(text);
              setRightName(name);
            })
          }
          onChange={setRight}
          onClear={() => {
            setRight("");
            setRightName("");
          }}
        />
      </div>

      <div className="ot-diff-toolbar">
        <Switch checked={ignoreCase} onCheckedChange={setIgnoreCase} label="忽略大小写" />
        <Switch
          checked={ignoreWhitespace}
          onCheckedChange={setIgnoreWhitespace}
          label="忽略行首尾空白"
        />
        <Switch checked={onlyDiff} onCheckedChange={setOnlyDiff} label="仅显示差异" />
        {result.state === "ok" ? (
          <span className="ot-hint">
            共 {result.lines.length} 行，其中未变化 {result.stats.unchanged} 行
          </span>
        ) : null}
      </div>

      <Panel className="ot-diff-result">
        <PanelHead
          title="差异结果"
          icon={<GitCompare size={14} />}
          actions={
            <>
              {result.state === "ok" ? (
                <>
                  <Badge variant="success">+{result.stats.added}</Badge>
                  <Badge variant="danger">−{result.stats.removed}</Badge>
                </>
              ) : null}
              <CopyButton value={exportText} label="复制差异" />
            </>
          }
        />
        <PanelBody flush>{body}</PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "file-diff",
    name: "文件对比",
    description: "逐行对比两份文件或文本，高亮新增、删除内容并支持忽略大小写与空白",
    category: "text",
    icon: GitCompare,
    keywords: ["diff", "对比", "比较", "文件", "差异", "patch", "文本对比"],
    order: 10,
  },
  component: FileDiffTool,
} satisfies ToolModule;
