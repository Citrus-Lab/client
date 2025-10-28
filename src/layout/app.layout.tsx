import { Outlet } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/auth-provider";
import Asidebar from "@/components/asidebar/asidebar";
import Header from "@/components/header";
import CreateWorkspaceDialog from "@/components/workspace/create-workspace-dialog";
import CreateProjectDialog from "@/components/workspace/project/create-project-dialog";

const AppLayout = () => {
  // Match the right sidebar's breakpoint behavior (1024px)
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return typeof window !== 'undefined' ? window.innerWidth > 1024 : true;
  });
  
  const previousWidthRef = useRef(typeof window !== 'undefined' ? window.innerWidth : 1920);

  useEffect(() => {
    const handleResize = () => {
      const currentWidth = window.innerWidth;
      const previousWidth = previousWidthRef.current;
      
      // Only auto-adjust sidebar when crossing the 1024px breakpoint
      if ((previousWidth <= 1024 && currentWidth > 1024) || 
          (previousWidth > 1024 && currentWidth <= 1024)) {
        setSidebarOpen(currentWidth > 1024);
      }
      
      previousWidthRef.current = currentWidth;
    };

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <AuthProvider>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Asidebar />
        <SidebarInset className="overflow-x-hidden h-[100dvh]">
          <div className="w-full h-full flex flex-col">
            <>
              <Header />
              <div className="px-3 lg:px-20 py-3 flex-1 overflow-auto">
                <Outlet />
              </div>
            </>
            <CreateWorkspaceDialog />
            <CreateProjectDialog />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthProvider>
  );
};

export default AppLayout;
