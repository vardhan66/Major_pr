import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/context/UserContext"; // Import UserProvider
import HomePage from "@/pages/HomePage";
import SignUpPage from "@/pages/SignUpPage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import SendPage from "@/pages/SendPage";
import ReceivePage from "@/pages/ReceivePage";
import ParticleBackground from "@/components/ParticleBackground";

const router = createBrowserRouter([
  { path: "/", element: <HomePage /> },
  { path: "/signup", element: <SignUpPage /> },
  { path: "/login", element: <LoginPage /> },
  { path: "/dashboard", element: <DashboardPage /> },
  { path: "/send", element: <SendPage /> },
  { path: "/receive", element: <ReceivePage /> },
]);

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="blaze-theme">
      <UserProvider> {/* Wrap with UserProvider */}
        <ParticleBackground />
        <RouterProvider router={router} />
        <Toaster />
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;