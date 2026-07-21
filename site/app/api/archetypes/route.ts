import { NextResponse } from "next/server";
import { cataloguePublic } from "@/lib/catalogue";

export function GET() {
  return NextResponse.json(cataloguePublic());
}
