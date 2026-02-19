import { useTranslation } from 'react-i18next';
import { saveLanguage, syncDayjsLocale } from './i18n';
import { GlobalOutlined } from '@ant-design/icons';

const languages = [
  { value: 'de', label: 'DE' },
  { value: 'en', label: 'EN' },
];

export const LanguagePicker: React.FC<{ collapsed?: boolean; theme?: 'dark' | 'light' }> = ({ collapsed, theme = 'dark' }) => {
  const { i18n } = useTranslation();
  const isDark = theme === 'dark';

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
    saveLanguage(value);
    syncDayjsLocale(value);
  };

  if (collapsed) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '12px 0',
          cursor: 'pointer',
        }}
        onClick={() => handleChange(i18n.language === 'de' ? 'en' : 'de')}
      >
        <GlobalOutlined style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)', fontSize: 16 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
      <GlobalOutlined style={{ color: isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.45)', fontSize: 14 }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {languages.map(lang => (
          <span
            key={lang.value}
            onClick={() => handleChange(lang.value)}
            style={{
              color: i18n.language === lang.value
                ? (isDark ? '#fff' : 'rgba(0, 0, 0, 0.88)')
                : (isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.35)'),
              fontWeight: i18n.language === lang.value ? 600 : 400,
              cursor: 'pointer',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 4,
              background: i18n.language === lang.value
                ? (isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)')
                : 'transparent',
              transition: 'all 0.2s',
            }}
          >
            {lang.label}
          </span>
        ))}
      </div>
    </div>
  );
};
