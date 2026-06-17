import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/Layout/MainLayout";
import Dashboard from "@/pages/Dashboard";
import StartupShutdown from "@/pages/StartupShutdown";
import Catalyst from "@/pages/Catalyst";
import Reaction from "@/pages/Reaction";
import Fractionation from "@/pages/Fractionation";
import EnergyRecovery from "@/pages/EnergyRecovery";
import Monitoring from "@/pages/Monitoring";
import Equipment from "@/pages/Equipment";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/startup-shutdown" element={<StartupShutdown />} />
          <Route path="/catalyst" element={<Catalyst />} />
          <Route path="/reaction-regeneration" element={<Reaction />} />
          <Route path="/fractionation" element={<Fractionation />} />
          <Route path="/energy-recovery" element={<EnergyRecovery />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/equipment" element={<Equipment />} />
        </Route>
      </Routes>
    </Router>
  );
}
