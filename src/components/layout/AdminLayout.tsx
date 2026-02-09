'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { ProgressSpinner } from 'primereact/progressspinner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <ProgressSpinner />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check if user has admin access
  if (user?.role !== 'Admin' && user?.role !== 'ContentManager') {
    return (
      <div className="flex align-items-center justify-content-center min-h-screen">
        <div className="text-center">
          <i className="pi pi-lock text-6xl text-color-secondary mb-4"></i>
          <h2>Access Denied</h2>
          <p className="text-color-secondary">
            You do not have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="layout-wrapper">
      <Sidebar />
      <div className="layout-main">
        <Topbar />
        <main className="layout-content">{children}</main>
      </div>
    </div>
  );
}
