"use client";

import { CSSProperties, ReactNode } from "react";
import { colors, fonts } from "@/lib/theme";

export function PrimaryButton({
  children,
  onClick,
  disabled,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={disabled ? undefined : "kk-pressable"}
      style={{
        width: "100%",
        background: disabled ? "rgba(245,241,230,0.25)" : colors.cream,
        color: colors.bg,
        fontFamily: fonts.heading,
        fontWeight: 800,
        fontSize: 16,
        border: "none",
        borderRadius: 12,
        padding: 17,
        textAlign: "center",
        letterSpacing: "0.05em",
        boxSizing: "border-box",
        cursor: disabled ? "default" : "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  style,
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      className="kk-pressable"
      style={{
        width: "100%",
        background: "transparent",
        color: colors.creamDim70,
        fontFamily: fonts.heading,
        fontWeight: 700,
        fontSize: 15,
        border: `1px solid ${colors.creamBorder}`,
        borderRadius: 12,
        padding: 15,
        textAlign: "center",
        boxSizing: "border-box",
        cursor: "pointer",
        ...style,
      }}
    >
      {children}
    </button>
  );
}
