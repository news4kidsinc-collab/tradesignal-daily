import { NextResponse } from "next/server";
import { robinhoodUniverse } from "@/data/ticker-universe";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(robinhoodUniverse);
}
