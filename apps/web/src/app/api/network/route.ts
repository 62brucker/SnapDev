import { networkInterfaces } from "node:os";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  const host = Object.values(networkInterfaces())
    .flatMap((addresses) => addresses ?? [])
    .find((address) => address.family === "IPv4" && !address.internal)?.address ?? "localhost";

  return NextResponse.json({ host });
}
