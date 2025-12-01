import { BrowserRouter } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BookingProvider } from "@/contexts/BookingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import AppRoutes from "@/Routes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BookingProvider>
        <LanguageProvider>
          <ThemeProvider>
            <BrowserRouter>
              <Toaster />
              <Sonner />
              <AppRoutes />
            </BrowserRouter>
          </ThemeProvider>
        </LanguageProvider>
      </BookingProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;


