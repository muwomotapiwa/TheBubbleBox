import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Header } from './components/Header';
import { FloatingBookButton } from './components/FloatingBookButton';
import { Home } from './pages/Home';
import { Pricing } from './pages/Pricing';
import { Services } from './pages/Services';
import { Subscription } from './pages/Subscription';
import { Booking } from './pages/Booking';
import { UserPortal } from './pages/UserPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { Unsubscribe } from './pages/Unsubscribe';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-[#F8F9FA]">
          <Header />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:serviceId" element={<Services />} />
            <Route path="/subscription" element={<Subscription />} />
            <Route path="/booking" element={<Booking />} />
            <Route path="/portal/*" element={<UserPortal />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
          </Routes>
          <FloatingBookButton />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
