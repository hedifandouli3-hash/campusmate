"use client";

import { AcademicChatsWorkspace } from "@/app/student/chats/page";

export default function TeacherChatsPage() {
  return <AcademicChatsWorkspace isModerator basePath="/teacher/chats" />;
}
