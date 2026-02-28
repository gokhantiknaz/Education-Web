'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  label: string;
  icon: string;
  href: string;
}

interface MenuSection {
  title?: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    items: [
      { label: 'Dashboard', icon: 'pi pi-home', href: '/' },
    ],
  },
  {
    title: 'Management',
    items: [
      { label: 'Users', icon: 'pi pi-users', href: '/users' },
      { label: 'Courses', icon: 'pi pi-book', href: '/courses' },
      { label: 'Categories', icon: 'pi pi-tags', href: '/categories' },
      { label: 'Notifications', icon: 'pi pi-bell', href: '/notifications' },
      { label: 'Promo Codes', icon: 'pi pi-ticket', href: '/promo-codes' },
    ],
  },
  {
    title: 'Content',
    items: [
      { label: 'Lessons', icon: 'pi pi-video', href: '/lessons' },
      { label: 'Quizzes', icon: 'pi pi-question-circle', href: '/quizzes' },
      { label: 'Certificates', icon: 'pi pi-verified', href: '/certificates' },
    ],
  },
  {
    title: 'Reports',
    items: [
      { label: 'Raporlar', icon: 'pi pi-chart-bar', href: '/reports' },
      { label: 'Enrollments', icon: 'pi pi-chart-line', href: '/enrollments' },
      { label: 'Orders', icon: 'pi pi-shopping-cart', href: '/orders' },
      { label: 'Reviews', icon: 'pi pi-comments', href: '/reviews' },
    ],
  },
  {
    title: 'Settings',
    items: [
      { label: 'Applications', icon: 'pi pi-th-large', href: '/applications' },
      { label: 'Professions', icon: 'pi pi-briefcase', href: '/professions' },
      { label: 'System', icon: 'pi pi-cog', href: '/settings' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="layout-sidebar">
      <div className="sidebar-logo">
        <h1>Education Platform</h1>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
          Admin Panel
        </span>
      </div>

      <nav className="sidebar-menu">
        {menuSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            {section.title && (
              <div className="sidebar-section-title">{section.title}</div>
            )}
            <ul>
              {section.items.map((item) => (
                <li key={item.href} className="sidebar-menu-item">
                  <Link
                    href={item.href}
                    className={pathname === item.href ? 'active' : ''}
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
