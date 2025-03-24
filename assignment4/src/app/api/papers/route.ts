import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Paper } from "@prisma/client";

export async function GET(): Promise<NextResponse<Paper[]>> {
  // TODO: Fetch all papers with authors, sorted by id ascending
  // TODO: Return as JSON response
}
