import { Palette } from "lucide-react";
import { useMemo, useState } from "react";

import { Alert, CopyButton, Panel, PanelBody, PanelHead, Textarea } from "@/components/ui";
import type { ToolModule } from "@/tools/types";

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const clamp = (value: number, min = 0, max = 255) => Math.min(max, Math.max(min, value));
const toHex = (value: number) => clamp(Math.round(value)).toString(16).padStart(2, "0");

function hslToRgb(h: number, s: number, l: number): Rgb {
  const saturation = s / 100;
  const lightness = l / 100;
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = chroma * (1 - Math.abs((hp % 2) - 1));

  let rgb: [number, number, number];
  if (hp < 1) rgb = [chroma, x, 0];
  else if (hp < 2) rgb = [x, chroma, 0];
  else if (hp < 3) rgb = [0, chroma, x];
  else if (hp < 4) rgb = [0, x, chroma];
  else if (hp < 5) rgb = [x, 0, chroma];
  else rgb = [chroma, 0, x];

  const m = lightness - chroma / 2;
  return {
    r: Math.round((rgb[0] + m) * 255),
    g: Math.round((rgb[1] + m) * 255),
    b: Math.round((rgb[2] + m) * 255),
  };
}

function rgbToHsl({ r, g, b }: Rgb): { h: number; s: number; l: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }

  return {
    h: Math.round((h + 360) % 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/** 解析 hex / rgb() / hsl() 三种输入形式 */
function parseColor(input: string): Rgb | null {
  const value = input.trim().toLowerCase();
  if (!value) return null;

  const hex = value.replace(/^#/, "");
  if (/^[0-9a-f]{3}$/.test(hex) || /^[0-9a-f]{6}$/.test(hex)) {
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((char) => char + char)
            .join("")
        : hex;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }

  const rgbMatch = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)/);
  if (rgbMatch) {
    return {
      r: clamp(Number(rgbMatch[1])),
      g: clamp(Number(rgbMatch[2])),
      b: clamp(Number(rgbMatch[3])),
    };
  }

  const hslMatch = value.match(/hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/);
  if (hslMatch) {
    return hslToRgb(Number(hslMatch[1]), Number(hslMatch[2]), Number(hslMatch[3]));
  }

  return null;
}

function relativeLuminance({ r, g, b }: Rgb): number {
  const channel = (value: number) => {
    const normalized = value / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ColorConverterTool() {
  const [input, setInput] = useState("#6d5efc");

  const parsed = useMemo(() => parseColor(input), [input]);

  const palette = useMemo(() => {
    if (!parsed) return [];
    const { h, s, l } = rgbToHsl(parsed);
    return [
      { label: "lighter-30", rgb: hslToRgb(h, s, clamp(l + 22, 0, 100)) },
      { label: "lighter-15", rgb: hslToRgb(h, s, clamp(l + 11, 0, 100)) },
      { label: "base", rgb: parsed },
      { label: "darker-15", rgb: hslToRgb(h, s, clamp(l - 11, 0, 100)) },
      { label: "darker-30", rgb: hslToRgb(h, s, clamp(l - 22, 0, 100)) },
    ];
  }, [parsed]);

  const rows = useMemo(() => {
    if (!parsed) return [];
    const hex = `#${toHex(parsed.r)}${toHex(parsed.g)}${toHex(parsed.b)}`;
    const { h, s, l } = rgbToHsl(parsed);
    const luminance = relativeLuminance(parsed);
    const contrast = (luminance + 0.05) / 0.05;

    return [
      { label: "HEX", value: hex },
      {
        label: "HEX 缩写",
        value:
          hex[1] === hex[2] && hex[3] === hex[4] && hex[5] === hex[6]
            ? `#${hex[1]}${hex[3]}${hex[5]}`
            : "—",
      },
      { label: "RGB", value: `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})` },
      { label: "RGBA", value: `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, 1)` },
      { label: "HSL", value: `hsl(${h}, ${s}%, ${l}%)` },
      {
        label: "亮度",
        value: luminance.toFixed(4),
      },
      {
        label: "对白对比度",
        value: `${contrast.toFixed(2)} : 1`,
      },
    ];
  }, [parsed]);

  return (
    <div className="ot-workspace ot-workspace--split">
      <div className="ot-stack">
        <Panel>
          <PanelHead title="颜色输入" icon={<Palette size={14} />} />
          <PanelBody>
            <Textarea
              mono
              value={input}
              placeholder={"支持 #6d5efc、#abc、rgb(109, 94, 252)、hsl(250, 90%, 68%)"}
              style={{ minHeight: 80 }}
              onChange={(event) => setInput(event.target.value)}
            />
            {parsed ? (
              <div
                style={{
                  marginTop: "var(--ot-space-3)",
                  height: 88,
                  borderRadius: "var(--ot-radius-md)",
                  border: "1px solid var(--ot-border)",
                  background: `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`,
                }}
              />
            ) : null}
            {!parsed && input.trim() ? (
              <Alert variant="error" className="ot-alert--error">
                <span style={{ display: "block", marginTop: "var(--ot-space-3)" }}>
                  无法识别的颜色格式，请使用 hex、rgb() 或 hsl()。
                </span>
              </Alert>
            ) : null}
          </PanelBody>
        </Panel>

        <Panel>
          <PanelHead title="明暗色阶" icon={<Palette size={14} />} />
          <PanelBody>
            {palette.length > 0 ? (
              <div className="ot-swatches">
                {palette.map((item) => {
                  const hex = `#${toHex(item.rgb.r)}${toHex(item.rgb.g)}${toHex(item.rgb.b)}`;
                  return (
                    <div className="ot-swatch" key={item.label}>
                      <div
                        className="ot-swatch__color"
                        style={{ background: `rgb(${item.rgb.r}, ${item.rgb.g}, ${item.rgb.b})` }}
                      />
                      <div className="ot-swatch__meta">
                        <span className="ot-swatch__name">{item.label}</span>
                        <span className="ot-swatch__value">{hex}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="ot-hint">解析成功后展示基于 HSL 推导的色阶。</p>
            )}
          </PanelBody>
        </Panel>
      </div>

      <Panel>
        <PanelHead title="转换结果" icon={<Palette size={14} />} />
        <PanelBody>
          {rows.length > 0 ? (
            <div className="ot-kv">
              {rows.map((row) => (
                <div className="ot-kv__row" key={row.label}>
                  <span className="ot-kv__key">{row.label}</span>
                  <span className="ot-kv__value">{row.value}</span>
                  <CopyButton value={row.value} label="复制" iconOnly />
                </div>
              ))}
            </div>
          ) : (
            <p className="ot-hint">输入一个有效颜色后，这里会列出全部常用表示形式。</p>
          )}
        </PanelBody>
      </Panel>
    </div>
  );
}

export default {
  meta: {
    id: "color-converter",
    name: "颜色转换",
    description: "HEX / RGB / HSL 互转，附带明暗色阶与对比度计算",
    category: "dev",
    icon: Palette,
    keywords: ["color", "颜色", "hex", "rgb", "hsl", "取色"],
    order: 30,
  },
  component: ColorConverterTool,
} satisfies ToolModule;
