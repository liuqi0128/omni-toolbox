/**
 * 剪贴板读写。优先使用异步 Clipboard API，失败时回退到 execCommand，
 * 以兼容部分 WebView 环境下的权限限制。
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 继续走回退方案
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.top = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export async function readText(): Promise<string> {
  try {
    return (await navigator.clipboard?.readText?.()) ?? "";
  } catch {
    return "";
  }
}
