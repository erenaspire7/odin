import {  SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import Header from "./header";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();

  const { toggleSidebar } = useSidebar();

  return (
    <div className="dark min-h-screen text-white overflow-hidden flex flex-col">
      <nav className="flex w-full z-40 p-6 bg-black items-center">
        {isConnected && (
          <div className="flex justify-between items-center mr-20">
            {/* <Button
              variant="outline"
              size="icon"
              onClick={() => toggleSidebar()}
            >
              <Menu />
            </Button> */}
            <SidebarTrigger />

          </div>
        )}
        <div className="w-screen mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-xl font-medium tracking-tight font-inter">
              Odin
            </span>
            <div className="ml-2 h-2 w-2 rounded-full bg-blue-500"></div>
          </div>
          {isConnected ? (
            <appkit-button />
          ) : (
            <Button
              variant="outline"
              className="font-poppins bg-black text-xs cursor-pointer"
              onClick={() => open()}
            >
              Engage
            </Button>
          )}
        </div>
      </nav>

      {isConnected ? (
        <div className="mt-32">
          <AppSidebar />
          <main>
            {children}
          </main>
        </div>
      ) : (
        <Header />
      )}
    </div>
  );
}
