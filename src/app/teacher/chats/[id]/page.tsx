"use client";

import { useParams } from "next/navigation";
import { AcademicChatsWorkspace } from "@/app/student/chats/page";

export default function TeacherChatGroupPage() {
  const { id } = useParams<{ id: string }>();
  return <AcademicChatsWorkspace initialGroupId={id} isModerator basePath="/teacher/chats" />;
}
