import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { SellerNavbar } from "./SellerNavbar";
import { Sidebar, SidebarLink } from "./Sidebar";
import { PageContainer } from "./PageContainer";

interface DashboardShellProps {
  links: SidebarLink[];
  children: ReactNode;
  seller?: boolean;
}

export function DashboardShell({ links, children, seller = false }: DashboardShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      {seller ? <SellerNavbar /> : <Navbar />}
      <PageContainer className="flex flex-col md:flex-row gap-6 flex-1">
        <Sidebar links={links} seller={seller} />
        <main className="flex-1 min-w-0">{children}</main>
      </PageContainer>
    </div>
  );
}
