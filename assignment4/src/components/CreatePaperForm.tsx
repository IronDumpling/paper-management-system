"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { PaperForm } from "./PaperForm";
import { createPaper } from "@/lib/actions";
import { Author } from "@prisma/client";

interface CreatePaperFormProps {
  authors: Author[];
}

export default function CreatePaperForm({ authors }: CreatePaperFormProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleAction = async (formData: FormData) => {
    startTransition(async () => {
      try {
        // TODO: Call createPaper Server Action
        // TODO: Set success message and redirect to "/" after 3 seconds
        await createPaper(formData);
        setMessage("Paper created successfully");
        setTimeout(() => router.push("/"), 3000);
      } catch (error) {
        const errorMessage =
        error instanceof Error ? error.message : "Error creating paper";
        setMessage(errorMessage);
      }
    });
  };

  return (
    <>
      {isPending && (
        <div className="absolute inset-0 bg-white/70 z-10 flex items-center justify-center">
          <p className="text-sm text-gray-600">Submitting paper...</p>
        </div>
      )}
      <PaperForm action={handleAction} authors={authors} />
      {message && (
        <p data-testid="status-message" className="text-sm">
          {message}
        </p>
      )}
    </>
  );
}
