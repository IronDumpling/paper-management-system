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
      } catch (error) {
        // TODO: Set error message
      }
    });
  };

  return (
    <>
      <PaperForm action={handleAction} authors={authors} />
      {message && (
        <p data-testid="status-message" className="text-sm">
          {message}
        </p>
      )}
    </>
  );
}
