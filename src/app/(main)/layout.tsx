"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ProjectProvider } from "@/contexts/project-context"
import { ProjectsSidebar } from "@/components/projects-sidebar"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProjectProvider>
      <SidebarProvider defaultOpen={false}>
        <ProjectsSidebar />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </ProjectProvider>
  )
}
