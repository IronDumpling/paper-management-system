import { Paper } from "@prisma/client";
import PaperCard from "./PaperCard";

interface PaperListProps {
  papers: (Paper & { authors: { name: string }[] })[];
}

export default function PaperList({ papers }: PaperListProps) {
  // TODO: Show “No papers found” if there is no paper in the database
  // TODO: Implement list rendering with PaperCard
  //       Use <ul className="space-y-4" data-testid="paper-list"></ul>
}
