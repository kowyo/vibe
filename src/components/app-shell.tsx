"use client"

import { type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { ProjectsSidebar } from "@/components/projects-sidebar"
import { ProjectProvider } from "@/contexts/project-context"

interface AppShellProps {
  children: ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname()

  return (
    <ProjectProvider>
      <SidebarProvider defaultOpen={false}>
        {pathname !== "/login" && <ProjectsSidebar />}
        <SidebarInset className="overflow-x-hidden">{children}</SidebarInset>
      </SidebarProvider>
    </ProjectProvider>
  )
}
