import { redirect } from "next/navigation";

export default function StudentMessagesRedirectPage() {
  redirect("/student/chats");
}
