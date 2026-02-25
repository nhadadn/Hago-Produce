import { AdminShell } from "@/components/layout/AdminShell";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminShell>
      <ErrorBoundary>{children}</ErrorBoundary>
    </AdminShell>
  );
}
