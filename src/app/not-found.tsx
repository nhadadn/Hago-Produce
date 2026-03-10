'use client';

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n";

export default function NotFound() {
  const [dashboardHref, setDashboardHref] = useState('/dashboard');
  const { t } = useLanguage();

  useEffect(() => {
    // If no access token in storage, send to login instead of dashboard
    const token = localStorage.getItem('accessToken') || localStorage.getItem('customerAccessToken');
    if (!token) {
      setDashboardHref('/login');
    }
  }, []);

  return (
    <div className="min-h-screen bg-hago-gray-100 flex items-center justify-center">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg">
        <div className="text-8xl font-bold text-hago-primary-800 mb-4">404</div>
        <h1 className="text-2xl font-bold text-hago-gray-900 mb-2">
          {t.notFound.title}
        </h1>
        <p className="text-hago-gray-600 mb-6">
          {t.notFound.description}
        </p>
        <Link
          href={dashboardHref}
          className="inline-flex h-10 items-center justify-center rounded-md bg-hago-primary-800 px-8 text-sm font-medium text-white transition-colors hover:bg-hago-primary-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-hago-primary-900 disabled:pointer-events-none disabled:opacity-50"
        >
          {t.notFound.backButton}
        </Link>
      </div>
    </div>
  );
}
