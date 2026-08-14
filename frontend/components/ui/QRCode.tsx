"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function QRCodeBox({ value, size = 84 }: { value: string; size?: number }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, { margin: 1, width: size * 3, color: { dark: "#0F2B1E", light: "#F5F1E6" } })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => setDataUrl(null));
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: "#F5F1E6",
        border: "1px solid rgba(245,241,230,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        overflow: "hidden",
      }}
    >
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={dataUrl} alt="QRコード" style={{ width: "100%", height: "100%" }} />
      ) : (
        <div style={{ fontSize: 9, color: "#0F2B1E" }}>QR</div>
      )}
    </div>
  );
}
