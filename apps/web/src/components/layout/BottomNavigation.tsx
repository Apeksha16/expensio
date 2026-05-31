'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Receipt, PieChart, Users, FolderOpen, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

interface BottomNavigationProps {}

export default function BottomNavigation({}: BottomNavigationProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Expenses', icon: Receipt, href: '/expenses' },
    { label: 'Budgets', icon: PieChart, href: '/budgets' },
    { label: 'Friends', icon: Users, href: '/friends' },
    { label: 'Groups', icon: FolderOpen, href: '/groups' },
  ];

  return null;
}
