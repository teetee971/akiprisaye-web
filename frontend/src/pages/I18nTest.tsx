 
/**
 * i18n Test Page
 * Demonstrates usage of translation components and hooks
 */

import { useTranslation } from 'react-i18next';
import { LanguageSelector } from '../components/i18n/LanguageSelector';
import { LocalizedText, useLocalizedFormat } from '../components/i18n/LocalizedText';
import { useLanguage } from '../hooks/useLanguage';

export default function I18nTest() {
  const { t } = useTranslation(['common', 'home', 'store']);
  const { currentLanguage, languages, isCreole } = useLanguage();
  const { formatPrice, formatDate, formatPercent } = useLocalizedFormat();

  const testPrice = 12.99;
  const testDate = new Date();
  const testPercent = 15.5;

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">
        Test i18n - AKiPriSaYe
      </h1>

      {/* Language selector variants */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Language Selectors</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Dropdown Variant</h3>
            <LanguageSelector variant="dropdown" />
          </div>

          <div>
            <h3 className="font-medium mb-2">Compact Variant</h3>
            <LanguageSelector variant="compact" />
          </div>

          <div>
            <h3 className="font-medium mb-2">List Variant</h3>
            <LanguageSelector variant="list" />
          </div>
        </div>
      </div>

      {/* Current language info */}
      <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Current Language</h2>
        <div className="space-y-2">
          <p><strong>Code:</strong> {currentLanguage.code}</p>
          <p><strong>Name:</strong> {currentLanguage.name}</p>
          <p><strong>Native:</strong> {currentLanguage.native}</p>
          <p><strong>Flag:</strong> {currentLanguage.flag}</p>
          <p><strong>Territory:</strong> {currentLanguage.territory}</p>
          <p><strong>Is Creole:</strong> {isCreole ? 'Yes' : 'No'}</p>
        </div>
      </div>

      {/* Translation tests */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Translation Tests</h2>
        
        <div className="space-y-3">
          <h3 className="font-medium text-lg mt-4">Common Namespace</h3>
          <p><strong>App Name:</strong> {t('common:app.name')}</p>
          <p><strong>Tagline:</strong> {t('common:app.tagline')}</p>
          <p><strong>Search:</strong> {t('common:nav.search')}</p>
          <p><strong>Add Action:</strong> {t('common:actions.add')}</p>
          <p><strong>Loading:</strong> {t('common:status.loading')}</p>
          
          <h3 className="font-medium text-lg mt-4">Home Namespace</h3>
          <p><strong>Hero Title:</strong> {t('home:hero.title')}</p>
          <p><strong>Hero Subtitle:</strong> {t('home:hero.subtitle')}</p>
          <p><strong>Nearby Stores:</strong> {t('home:nearby.title')}</p>
          
          <h3 className="font-medium text-lg mt-4">Store Namespace</h3>
          <p><strong>Store Details:</strong> {t('store:details.title')}</p>
          <p><strong>Monday:</strong> {t('store:hours.monday')}</p>
          <p><strong>Reviews:</strong> {t('store:reviews.title')}</p>
        </div>
      </div>

      {/* Formatting tests */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Formatting Tests</h2>
        
        <div className="space-y-3">
          <p><strong>Price:</strong> {formatPrice(testPrice)}</p>
          <p><strong>Date:</strong> {formatDate(testDate)}</p>
          <p><strong>Percent:</strong> {formatPercent(testPercent)}</p>
        </div>
      </div>

      {/* Interpolation tests */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Interpolation Tests</h2>
        
        <div className="space-y-3">
          <p><strong>Opens at:</strong> {t('common:time.opensAt', { time: '09:00' })}</p>
          <p><strong>Closes at:</strong> {t('common:time.closesAt', { time: '18:00' })}</p>
          <p><strong>Review count:</strong> {t('store:reviews.count', { count: 5 })}</p>
          <p><strong>Product count:</strong> {t('store:products.count', { count: 42 })}</p>
        </div>
      </div>

      {/* All available languages */}
      <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-semibold mb-4">Available Languages</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {languages.map(lang => (
            <div key={lang.code} className="p-4 border rounded-lg">
              <div className="text-3xl mb-2">{lang.flag}</div>
              <p className="font-medium">{lang.native}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{lang.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500">{lang.code}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
