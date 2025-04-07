import prisma from "@/lib/prisma";
import { Author } from "@prisma/client";
import CreatePaperForm from "@/components/CreatePaperForm";

async function getAuthors(): Promise<Author[]> {
  // TODO: Fetch authors from Prisma, sorted by id ascending
  return await prisma.author.findMany({ orderBy: { id: "asc" } });
}

export default async function CreatePaper() {
  const authors = await getAuthors();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Paper</h1>
      <CreatePaperForm authors={authors} />
    </div>
  );
}
