"use client";

import { useEffect } from "react";

// ルーム画面を開いている間、対応端末（Chrome/Edge、iOS16.4+のSafari等）で
// 画面の自動ロックを防ぐ。非対応ブラウザでは何もしない（エラーにもしない）。
// タブがバックグラウンドになるとWake Lockは自動解除されるため、
// 再度フォアグラウンドに戻ったタイミングで再取得する。
export function useWakeLock() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const requestLock = async () => {
      try {
        const lock = await (navigator as Navigator & { wakeLock: WakeLock }).wakeLock.request("screen");
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // 端末の設定やバッテリーセーバー等で取得できない場合は諦める
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestLock();
      }
    };

    void requestLock();
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, []);
}

interface WakeLockSentinel {
  release(): Promise<void>;
}
interface WakeLock {
  request(type: "screen"): Promise<WakeLockSentinel>;
}
