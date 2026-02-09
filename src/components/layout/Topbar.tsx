'use client';

import React, { useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from 'primereact/button';
import { Menu } from 'primereact/menu';
import { Avatar } from 'primereact/avatar';
import { MenuItem } from 'primereact/menuitem';

export default function Topbar() {
  const { user, logout } = useAuth();
  const menuRef = useRef<Menu>(null);

  const userMenuItems: MenuItem[] = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => {
        // Navigate to profile
      },
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => {
        // Navigate to settings
      },
    },
    {
      separator: true,
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: () => {
        logout();
      },
    },
  ];

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <header className="layout-topbar">
      <div className="flex align-items-center gap-3">
        <Button
          icon="pi pi-bars"
          className="p-button-text p-button-rounded lg:hidden"
          onClick={() => {
            // Toggle sidebar on mobile
            const sidebar = document.querySelector('.layout-sidebar');
            sidebar?.classList.toggle('active');
          }}
        />
        <span className="text-xl font-semibold text-color-secondary">
          Admin Panel
        </span>
      </div>

      <div className="flex align-items-center gap-3">
        <Button
          icon="pi pi-bell"
          className="p-button-text p-button-rounded"
          badge="3"
          badgeClassName="p-badge-danger"
        />

        <div
          className="flex align-items-center gap-2 cursor-pointer"
          onClick={(e) => menuRef.current?.toggle(e)}
        >
          <Avatar
            label={getInitials()}
            shape="circle"
            style={{ backgroundColor: '#1e3a5f', color: '#ffffff' }}
          />
          <div className="hidden md:block">
            <div className="font-medium text-sm">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-color-secondary">{user?.role}</div>
          </div>
          <i className="pi pi-chevron-down text-xs"></i>
        </div>

        <Menu model={userMenuItems} popup ref={menuRef} />
      </div>
    </header>
  );
}
