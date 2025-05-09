"use client"

import type React from "react"

import {
  BarChart2,
  Receipt,
  CreditCard,
  Wallet,
  Settings,
  HelpCircle,
  Menu,
  Home,
  type LucideIcon
} from "lucide-react"

import Link from "next/link"
import { useState } from "react"
import Image from "next/image"

export default function Sidebar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  function handleNavigation() {
    setIsMobileMenuOpen(false)
  }

  function NavItem({
    href,
    icon: Icon,
    children,
  }: {
    href: string
    icon: LucideIcon
    children: React.ReactNode
  }) {
    return (
      <Link
        href={href}
        onClick={handleNavigation}
        className="flex items-center px-3 py-2 text-sm rounded-md transition-colors text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1F1F23]"
      >
        <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
        {children}
      </Link>
    )
  }

  return (
    <>
      <button
        type="button"
        className="lg:hidden fixed top-4 left-4 z-[50] p-2 rounded-lg bg-white text-black dark:bg-[#08080a] shadow-md"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
      </button>
      <nav
        className={`
          w-64 h-full bg-white text-black dark:bg-[#08080a] border-r border-gray-200 dark:border-[#1F1F23]
          fixed inset-y-0 left-0 z-[60] transform transition-transform duration-200 ease-in-out
          lg:static lg:translate-x-0 lg:h-screen lg:flex-shrink-0
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">
          <div
            className="px-6 py-5.5 flex items-center border-b border-gray-200 dark:border-[#1F1F23] flex-shrink-0"
          >
            <div className="flex items-center">
              <Image
                src="https://kokonutui.com/logo.svg"
                alt="KokonutUI"
                width={32}
                height={32}
                className="flex-shrink-0 hidden dark:block"
              />
              <Image
                src="https://kokonutui.com/logo-black.svg"
                alt="KokonutUI"
                width={32}
                height={32}
                className="flex-shrink-0 block dark:hidden"
              />
              <span className="ml-2 text-lg font-semibold hover:cursor-pointer text-gray-900 dark:text-white">
                KokonutUI
              </span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-4 px-4">
            <div className="space-y-6">
              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  IDEAS
                </div>
                <div className="space-y-1">
                  <NavItem href="#" icon={Home}>
                    Dashboard
                  </NavItem>
                  <NavItem href="/ideas" icon={BarChart2}>
                    Generate Ideas
                  </NavItem>
                </div>
              </div>

              <div>
                <div className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  POSTS
                </div>
                <div className="space-y-1">
                  <NavItem href="/twitter" icon={Wallet}>
                    Twitter
                  </NavItem>
                  <NavItem href="/youtube" icon={Receipt}>
                    Youtube
                  </NavItem>
                  <NavItem href="/instagram" icon={CreditCard}>
                    Instagram
                  </NavItem>
                </div>
              </div>
            </div>
          </div>

          <div className="px-4 py-4 border-t border-gray-200 dark:border-[#1F1F23] flex-shrink-0">
            <div className="space-y-1">
              <NavItem href="#" icon={Settings}>
                Settings
              </NavItem>
              <NavItem href="#" icon={HelpCircle}>
                Logout
              </NavItem>
            </div>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[55] lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
