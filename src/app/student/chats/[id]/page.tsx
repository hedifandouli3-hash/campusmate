"use client";

import { useParams } from "next/navigation";
import { AcademicChatsWorkspace } from "../page";

export default function StudentChatGroupPage() {
  const { id } = useParams<{ id: string }>();
  return <AcademicChatsWorkspace initialGroupId={id} />;
}
