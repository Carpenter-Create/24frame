import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "asset-upload.tsx"), "utf8");

describe("AssetUpload abort wiring", () => {
  it("aborts the upload controller when the control unmounts", () => {
    const effect = src.slice(src.indexOf("useEffect("), src.indexOf("async function onUpload"));
    expect(effect).toContain("return () => {");
    expect(effect).toContain("abortRef.current?.abort()");
    expect(src).toContain("const abortRef = useRef<AbortController | null>(null);");
    expect(src).toContain("signal: controller.signal");
    expect(src).toContain("if (isUploadAbort(err) || controller.signal.aborted) return;");
    expect(src).toContain("setPct(null);");
  });
});
