"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createAuthor } from "@/lib/actions";

export default function CreateAuthor() {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = async (formData: FormData) => {
    startTransition(async () => {
      try {
        // TODO: Call createAuthor Server Action
        // TODO: Set success message and redirect to "/" after 3 seconds
        const name = formData.get("name")?.toString().trim();
        const email = formData.get("email")?.toString().trim();
        const affiliation = formData.get("affiliation")?.toString().trim();

        await createAuthor(formData);
        setMessage("Author created successfully");
        setTimeout(() => router.push("/"), 3000);
      } catch (err: any) {
        const message = err.message || "Error creating author";
        setMessage(message);
      }
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Create New Author</h1>
      <form action={handleAction} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">
            Name
          </label>
          {/* TODO: Add a text input for the name, styled with Tailwind */}
          <input
            type="text"
            id="name"
            name="name"
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email (optional)
          </label>
          {/* TODO: Add a text input for the email, styled with Tailwind */}
          <input
            type="email"
            id="email"
            name="email"
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label htmlFor="affiliation" className="block text-sm font-medium">
            Affiliation (optional)
          </label>
          {/* TODO: Add a text input for the affiliation, styled with Tailwind */}
          <input
            type="text"
            id="affiliation"
            name="affiliation"
            className="border p-2 w-full"
          />
        </div>
        <Button
          data-testid="create-author-btn"
          type="submit"
          disabled={isPending}
        >
          Create Author
        </Button>
        {/* TODO: Display status message here */}
        {message && (
          <p data-testid="status-message" className="text-sm">
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
