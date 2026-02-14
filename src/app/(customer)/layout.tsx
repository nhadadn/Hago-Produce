import { AdminShell } from "@/components/layout/AdminShell";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
