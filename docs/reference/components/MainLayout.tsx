import { useState } from "react";
import { Outlet, useMatches } from "react-router-dom";
import { Header } from "@/components/Header";
import SideBar from "@/components/Sidebar";
import { useAuth } from "@/hooks/useAuth";

interface Title {
  title: string;
}

export default function MainLayout() {
  const matches = useMatches();
  const currentMatch = matches.find((match) => (match.handle as Title)?.title);
  const title = (currentMatch?.handle as Title)?.title || "Página";
  const { userData } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0 min-h-0">
        <Header title={title} onMenuClick={() => setSidebarOpen((prev) => !prev)} />
        <main className="flex-1 overflow-auto mt-8 mx-4 p-4 border border-input_border rounded-md">
          <Outlet />
          <footer className="mt-8 text-center text-sm">
            © {new Date().getFullYear()} {userData?.companyName}
          </footer>
        </main>
      </div>
    </div>
  );
}
