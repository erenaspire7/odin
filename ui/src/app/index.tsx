import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";
import { base, baseSepolia, AppKitNetwork } from "@reown/appkit/networks";
import { createSIWE } from "./../lib/siwe";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";

import Home from "./pages/home";

// 1. Get projectId
const projectId = import.meta.env.VITE_APPKIT_PROJECT_ID;

// 2. Set the networks

// 3. Create a metadata object - optional
const metadata = {
  name: "My Website",
  description: "My Website description",
  url: "https://mywebsite.com", // origin must match your domain & subdomain
  icons: ["https://avatars.mywebsite.com/"],
};

const networks: [AppKitNetwork, ...AppKitNetwork[]] = [baseSepolia];

const siweConfig = createSIWE(networks);

// 4. Create a AppKit instance
createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  // metadata,
  projectId,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  siweConfig,
});

export default function App() {
  return (
    <SidebarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </SidebarProvider>
  );
}
