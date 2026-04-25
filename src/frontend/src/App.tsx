/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import AuthLayout from './layouts/AuthLayout';
import SetupLayout from './layouts/SetupLayout';
import DashboardLayout from './layouts/DashboardLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { 
  StepWelcome, StepCompany, 
  StepWhatsApp, StepPayments, StepFirstBooking 
} from './pages/setup/SetupSteps';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
        </Route>

        {/* Setup Wizard Routes */}
        <Route path="/setup" element={<SetupLayout />}>
          <Route index element={<Navigate to="welcome" replace />} />
          <Route path="welcome" element={<StepWelcome />} />
          <Route path="company" element={<StepCompany />} />
          <Route path="whatsapp" element={<StepWhatsApp />} />
          <Route path="payments" element={<StepPayments />} />
          <Route path="first-booking" element={<StepFirstBooking />} />
        </Route>

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="*" element={<div className="p-8 text-center text-slate-500">Página em construção (Protótipo)</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

