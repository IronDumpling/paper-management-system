import Link from "next/link";
import { Suspense } from "react";
import PaperList from "@/components/PaperList";
import { Paper } from "@prisma/client";

async function getPapers(): Promise<{
  papers: (Paper & { authors: { name: string }[] })[];
  error: string | null;
}> {
  try {
    // TODO: Fetch papers from /api/papers endpoint
  } catch {
    return { papers: [], error: "Error loading papers" };
  }
}

async function PapersSection() {
  const { papers, error } = await getPapers();
  // TODO: Render papers or an error message based on getPapers() result
}

export default async function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold">Paper Management System</h1>
      <nav className="space-x-4">
        <Link href="/papers/create" className="text-blue-500 underline">
          Create New Paper
        </Link>
        <Link href="/authors/create" className="text-blue-500 underline">
          Create New Author
        </Link>
      </nav>
      <section>
        <h2 className="text-2xl font-semibold mb-4">Papers</h2>
        {/* TODO: Implement Suspense to handle loading states
         */}
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
