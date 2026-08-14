"use client";

import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { AvatarValue, PRESET_AVATARS, fileToAvatarDataUrl } from "@/lib/avatar";
import { colors, fonts } from "@/lib/theme";

export function AvatarPicker({
  name,
  value,
  onChange,
}: {
  name: string;
  value: AvatarValue | null;
  onChange: (v: AvatarValue) => void;
}) {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setProcessing(true);
    try {
      const dataUrl = await fileToAvatarDataUrl(file);
      onChange({ avatarType: "photo", avatarValue: dataUrl });
    } catch {
      setError("画像の読み込みに失敗しました");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontFamily: fonts.heading, fontSize: 12, letterSpacing: "0.1em", color: colors.creamDim50 }}>
        アイコン
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar
          name={name || "?"}
          avatarType={value?.avatarType}
          avatarValue={value?.avatarValue}
          size={56}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          <div
            className="kk-pressable"
            onClick={() => !processing && galleryInputRef.current?.click()}
            style={{
              border: `1px solid ${colors.creamBorder}`,
              borderRadius: 10,
              padding: "9px 12px",
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.creamDim70,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            🖼️ 写真から選ぶ
          </div>
          <div
            className="kk-pressable"
            onClick={() => !processing && cameraInputRef.current?.click()}
            style={{
              border: `1px solid ${colors.creamBorder}`,
              borderRadius: 10,
              padding: "9px 12px",
              fontFamily: fonts.body,
              fontSize: 13,
              color: colors.creamDim70,
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            📷 カメラで撮影
          </div>
        </div>
      </div>

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        style={{ display: "none" }}
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      {processing && (
        <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.creamDim55 }}>画像を処理しています...</div>
      )}
      {error && <div style={{ fontFamily: fonts.body, fontSize: 11, color: colors.red }}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
        {PRESET_AVATARS.map((emoji) => {
          const active = value?.avatarType === "preset" && value.avatarValue === emoji;
          return (
            <div
              key={emoji}
              className="kk-pressable"
              onClick={() => onChange({ avatarType: "preset", avatarValue: emoji })}
              style={{
                aspectRatio: "1",
                borderRadius: 10,
                background: active ? colors.cream : "rgba(245,241,230,0.06)",
                border: active ? "none" : "1px solid rgba(245,241,230,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                cursor: "pointer",
              }}
            >
              {emoji}
            </div>
          );
        })}
      </div>
    </div>
  );
}
