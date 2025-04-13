import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { useAppKit, useAppKitAccount } from "@reown/appkit/react";
import Header from "./header";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { open } = useAppKit();
  const { isConnected } = useAppKitAccount();
  const { state } = useSidebar();

  const [isLoading, setIsLoading] = useState(true);

  // Handle initial loading state
  useEffect(() => {
    // Wait for authentication state to stabilize
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Short delay to allow auth to initialize

    return () => clearTimeout(timer);
  }, [isConnected]);

  if (isLoading) {
    return (
      <div className="w-full text-black dark min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dark min-h-screen text-white overflow-hidden flex flex-col grow">
      <nav className="fixed top-0 flex w-full z-40 p-6 bg-black items-center">
        {isConnected && (
          <div className="flex justify-between items-center mr-20">
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
        <div className="pt-30 w-full">
          <AppSidebar />
          <main
            className={`${state == "expanded" ? "ml-72" : "ml-20"} font-inter pr-8`}
          >
            {children}
          </main>
          <Toaster />
        </div>
      ) : (
        <Header />
      )}
    </div>
  );
}
