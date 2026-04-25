import React from 'react';
import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Outlet />
    </div>
  );
}
