import { useTranslation } from 'react-i18next';
import { saveLanguage, syncDayjsLocale } from './i18n';
import { GlobalOutlined } from '@ant-design/icons';

const languages = [
  { value: 'de', label: 'DE' },
  { value: 'en', label: 'EN' },
];

export const LanguagePicker: React.FC<{ collapsed?: boolean }> = ({ collapsed }) => {
  const { i18n } = useTranslation();

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
        <GlobalOutlined style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 16 }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px' }}>
      <GlobalOutlined style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 14 }} />
      <div style={{ display: 'flex', gap: 4 }}>
        {languages.map(lang => (
          <span
            key={lang.value}
            onClick={() => handleChange(lang.value)}
            style={{
              color: i18n.language === lang.value ? '#fff' : 'rgba(255, 255, 255, 0.45)',
              fontWeight: i18n.language === lang.value ? 600 : 400,
              cursor: 'pointer',
              fontSize: 13,
              padding: '2px 6px',
              borderRadius: 4,
              background: i18n.language === lang.value ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
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
