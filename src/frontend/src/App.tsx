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
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import {
  StepWelcome,
  StepProfessionals,
  StepServices,
  StepSettings,
  StepDone,
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

        {/* Register — layout próprio (split full-width, PRD-v2 §5.1.1) */}
        <Route path="register" element={<Register />} />

        {/* Setup Wizard Routes — PRD-v2 §5.2 */}
        <Route path="/setup" element={<SetupLayout />}>
          <Route index element={<Navigate to="welcome" replace />} />
          <Route path="welcome"       element={<StepWelcome />} />
          <Route path="professionals" element={<StepProfessionals />} />
          <Route path="services"      element={<StepServices />} />
          <Route path="settings"      element={<StepSettings />} />
          <Route path="done"          element={<StepDone />} />
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

