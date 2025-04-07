import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Paper } from "@prisma/client";

export async function GET(): Promise<NextResponse<Paper[]>> {
  // TODO: Fetch all papers with authors, sorted by id ascending
  // TODO: Return as JSON response
  try {
    const papers = await prisma.paper.findMany({
      orderBy: { id: "asc" },
      include: { authors: true },
    });

    return NextResponse.json(papers);
  } catch (error) {
    console.error("Error fetching papers:", error);
    return new NextResponse("Failed to fetch papers", { status: 500 });
  }
}
