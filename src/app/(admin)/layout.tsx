import dynamic from 'next/dynamic';
import { AdminShell } from "@/components/layout/AdminShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const FloatingChatAssistant = dynamic(
  () => import('@/components/chat/FloatingChatAssistant').then(m => m.FloatingChatAssistant),
  { ssr: false }
);

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
