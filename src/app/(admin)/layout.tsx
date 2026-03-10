import { AdminShell } from "@/components/layout/AdminShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { FloatingChatAssistant } from "@/components/chat/FloatingChatAssistant";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>
      <ErrorBoundary>{children}</ErrorBoundary>
      <FloatingChatAssistant />
    </AdminShell>
  );
}
