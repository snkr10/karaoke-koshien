import { randomBytes } from "crypto";

export function generateHostToken(): string {
  return randomBytes(24).toString("hex");
}
