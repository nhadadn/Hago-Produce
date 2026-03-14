'use client';

import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/useLanguage';

export function Footer() {
  const { t } = useLanguage();
  const tf = t.landing.footer;
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-hago-primary-900 text-white">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold text-white mb-3">Hago Produce</h3>
            <p className="text-sm text-hago-primary-200 leading-relaxed">
              {tf.brandDescription}
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-sm font-semibold text-hago-primary-100 uppercase tracking-wider mb-4">
              {tf.platformLabel}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="#features" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  {tf.features}
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  {tf.adminPortal}
                </Link>
              </li>
              <li>
                <Link href="/portal/login" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  {tf.customerPortal}
                </Link>
              </li>
              <li>
                <Link href="#contact" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  {tf.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-hago-primary-100 uppercase tracking-wider mb-4">
              {tf.legalLabel}
            </h4>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  {tf.terms}
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-hago-primary-200 hover:text-white transition-colors">
                  {tf.privacy}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-hago-primary-800 pt-8">
          <p className="text-center text-xs text-hago-primary-300">
            &copy; {currentYear} Hago Produce. {tf.copyright}
          </p>
        </div>
      </div>
    </footer>
  );
}
