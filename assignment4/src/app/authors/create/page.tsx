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
      } catch (error) {
        // TODO: Set error message
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
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">
            Email (optional)
          </label>
          {/* TODO: Add a text input for the email, styled with Tailwind */}
        </div>
        <div>
          <label htmlFor="affiliation" className="block text-sm font-medium">
            Affiliation (optional)
          </label>
          {/* TODO: Add a text input for the affiliation, styled with Tailwind */}
        </div>
        <Button
          data-testid="create-author-btn"
          type="submit"
          disabled={isPending}
        >
          Create Author
        </Button>
        {/* TODO: Display status message here */}
      </form>
    </div>
  );
}
