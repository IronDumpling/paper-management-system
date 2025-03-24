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
}

export async function createAuthor(formData: FormData) {
  // TODO: Implement author creation with validation
  // - Show "Name is required" when name is not provided
  // - Create author with Prisma, including optional email and affiliation
}
