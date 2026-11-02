import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Fleet } from './pages/Fleet';
import { VesselDetails } from './pages/VesselDetails';
import { Datasets } from './pages/Datasets';
import { FuelPrediction } from './pages/FuelPrediction';
import { CostEmissions } from './pages/CostEmissions';
import { Optimization } from './pages/Optimization';
import { OptimizationResults } from './pages/OptimizationResults';
import { Scenarios } from './pages/Scenarios';
import { Benchmarks } from './pages/Benchmarks';
import { History } from './pages/History';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Login } from './pages/Login';
import { GeospatialMap } from './pages/GeospatialMap';
import { QuantumLab } from './pages/QuantumLab';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Core Authenticated App */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="geospatial" element={<GeospatialMap />} />
          <Route path="quantum-lab" element={<QuantumLab />} />
          <Route path="fleet" element={<Fleet />} />
          <Route path="fleet/:id" element={<VesselDetails />} />
          <Route path="datasets" element={<Datasets />} />
          <Route path="prediction" element={<FuelPrediction />} />
          <Route path="calculator" element={<CostEmissions />} />
          <Route path="optimization" element={<Optimization />} />
          <Route path="results/:id" element={<OptimizationResults />} />
          <Route path="scenarios" element={<Scenarios />} />
          <Route path="benchmarks" element={<Benchmarks />} />
          <Route path="history" element={<History />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

