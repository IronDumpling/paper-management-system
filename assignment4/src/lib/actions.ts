"use server";

import prisma from "@/lib/prisma";

export async function createPaper(formData: FormData) {
  // TODO: Implement paper creation with validation
  // - Show appropriate error messages for:
  //    - "Title is required"
  //    - "Publication venue is required"
  //    - "Publication year is required"
  //    - "Valid year after 1900 is required"
  //    - "Please select at least one author"
  // - Create paper with Prisma
  const title = formData.get("title")?.toString().trim();
  const publishedIn = formData.get("publishedIn")?.toString().trim();
  const year = Number(formData.get("year"));
  const authorIds = formData.getAll("authorIds").map((id) => Number(id));

  if (!title) throw new Error("Title is required");
  if (!publishedIn) throw new Error("Publication venue is required");
  if (!year) throw new Error("Publication year is required");
  if (year <= 1900) throw new Error("Valid year after 1900 is required");
  if (!authorIds.length) throw new Error("Please select at least one author");

  await prisma.paper.create({
    data: {
      title,
      publishedIn,
      year,
      authors: {
        connect: authorIds.map((id) => ({ id })),
      },
    },
  });
}

export async function createAuthor(formData: FormData) {
  // TODO: Implement author creation with validation
  // - Show "Name is required" when name is not provided
  // - Create author with Prisma, including optional email and affiliation
  const name = formData.get("name")?.toString().trim();
  const email = formData.get("email")?.toString().trim() || null;
  const affiliation = formData.get("affiliation")?.toString().trim() || null;

  if (!name) throw new Error("Name is required");

  await prisma.author.create({
    data: { name, email, affiliation },
  });
}
