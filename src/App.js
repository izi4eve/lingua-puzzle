import React, { useState, useEffect, useMemo } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import FileUploader from './components/FileUploader';
import LearningComponent from './components/LearningComponent';
import NavigationComponent from './components/NavigationComponent';
import DictionaryPlayer from './components/DictionaryPlayer';
import Relax from './components/Relax';
import Tips from './components/Tips';
import CookieConsent from "react-cookie-consent";
import { FaTelegramPlane } from 'react-icons/fa';
import { MdTipsAndUpdates } from "react-icons/md";

const App = () => {
  const { t, i18n } = useTranslation();

  const appUrl = "https://izi4eve.github.io/lingua-puzzle/";
  const telegramLink = 'https://t.me/+4VltkaBLy4AzZmFi';

  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('data');
    return savedData ? JSON.parse(savedData) : [];
  });

  const [firstElement, setFirstElement] = useState(() => {
    const savedFirstElement = localStorage.getItem('firstElement');
    return savedFirstElement ? JSON.parse(savedFirstElement) : 0;
  });

  const supportedLanguages = useMemo(() => [
    { code: 'en', name: 'English' },
    { code: 'de', name: 'Deutsch' },
    { code: 'fr', name: 'Français' },
    { code: 'it', name: 'Italiano' },
    { code: 'es', name: 'Español' },
    { code: 'pt', name: 'Português' },
    { code: 'pl', name: 'Polski' },
    { code: 'cs', name: 'Čeština' },
    { code: 'uk', name: 'Українська' },
    { code: 'sh', name: 'Srpski' },
    { code: 'ru', name: 'Русский' },
    { code: 'tr', name: 'Türkçe' },
    { code: 'ar', name: 'العربية' },
    { code: 'fa', name: 'فارسی' },
  ], []);
  const [language, setLanguage] = useState(localStorage.getItem('selectedLanguage') || 'en');
  const [ttsLanguage, setTTSLanguage] = useState(localStorage.getItem('ttsLanguage') || 'en-US');
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem('selectedLanguage') || 'en'); // Добавляем selectedLanguage

  const languages = [
    { name: 'English', code: 'en-US' },
    { name: 'Deutsch', code: 'de-DE' },
    { name: 'Français', code: 'fr-FR' },
    { name: 'Italiano', code: 'it-IT' },
    { name: 'Español', code: 'es-ES' },
    { name: 'Português', code: 'pt-PT' },
    { name: 'Polski', code: 'pl-PL' },
    { name: 'Čeština', code: 'cs-CZ' },
  ];

  const privacyPolicyPath = i18n.language === 'en' ? '/policies/privacy-policy.md' : `/policies/privacy-policy.${i18n.language}.md`;

  const [count, setCount] = useState(() => {
    const savedCount = localStorage.getItem('count');
    return savedCount ? JSON.parse(savedCount) : 5; // Значение по умолчанию - 5
  });

  useEffect(() => {
    localStorage.setItem('count', JSON.stringify(count));
  }, [count]);

  const handleDataLoaded = (loadedData) => {
    setFirstElement(0);
    setData(loadedData);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  const handleTTSLanguageChange = (newTTSLanguage) => {
    setTTSLanguage(newTTSLanguage);
    localStorage.setItem('ttsLanguage', newTTSLanguage);
  };

  const handleSelectedLanguageChange = (newSelectedLanguage) => { // Новый обработчик
    setSelectedLanguage(newSelectedLanguage);
    localStorage.setItem('selectedLanguage', newSelectedLanguage);
  };

  const handleMarkAsLearned = (recordToMark) => {
    setData(prevData => {
      return prevData.map(item =>
        item.foreignPart === recordToMark.foreignPart &&
          item.translation === recordToMark.translation
          ? { ...item, isLearned: true }
          : item
      );
    });
  };

  const handleEditEntry = (oldEntry, newEntry) => {
    setData(prevData => {
      return prevData.map(item =>
        item.foreignPart === oldEntry.foreignPart &&
          item.translation === oldEntry.translation &&
          item.tipPart === oldEntry.tipPart
          ? { ...item, ...newEntry }
          : item
      );
    });
  };

  const handleDeleteEntry = (entryToDelete) => {
    setData(prevData => {
      const newData = prevData.filter(item =>
        !(item.foreignPart === entryToDelete.foreignPart &&
          item.translation === entryToDelete.translation &&
          item.tipPart === entryToDelete.tipPart)
      );

      // Если удаляем текущую запись, сбрасываем позицию
      if (newData.length === 0) {
        setFirstElement(0);
      } else {
        const currentFilteredData = prevData.filter(item => !item.isLearned);
        const currentIndex = currentFilteredData.findIndex(item =>
          item.foreignPart === entryToDelete.foreignPart &&
          item.translation === entryToDelete.translation &&
          item.tipPart === entryToDelete.tipPart
        );

        if (currentIndex !== -1 && firstElement >= currentIndex) {
          setFirstElement(Math.max(0, firstElement - 1));
        }
      }

      return newData;
    });
  };

  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('firstElement', JSON.stringify(firstElement));
  }, [firstElement]);

  useEffect(() => {
    const browserLanguage = navigator.language.split('-')[0];
    const savedLanguage = localStorage.getItem('selectedLanguage');

    if (!savedLanguage) {
      const defaultLanguage = supportedLanguages.find(lang => lang.code === browserLanguage)?.code || 'en';
      setLanguage(defaultLanguage);
      localStorage.setItem('selectedLanguage', defaultLanguage);
      i18n.changeLanguage(defaultLanguage);
    } else {
      i18n.changeLanguage(savedLanguage);
      setLanguage(savedLanguage);
    }
  }, [i18n, supportedLanguages]);

  useEffect(() => {
    // Отправляем событие page_view при загрузке приложения
    window.gtag('event', 'page_view', {
      page_path: window.location.pathname + window.location.search,
    });
  }, []);

  return (
    <div
      className="container no-select"
    // onContextMenu={(e) => e.preventDefault()} // Disable the context menu
    >
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-7 overflow-hidden">

          <div className="d-flex pt-2 pb-0 overflow-hidden">
            <div>
              <h4 className='logo px-2 pt-1 pb-1 mb-2 fw-bold'>Lingua Puzzle</h4>
              <p className='fs-6 fw-medium fst-italic lh-1 px-2 m-0'>
                <MdTipsAndUpdates size={19} /> {t('howto')}
              </p>
            </div>
            <div className="flex-grow-1 px-2 text-end">
              {supportedLanguages.map((lng) => (
                <button
                  key={lng.code}
                  className={`btn btn-sm rounded-pill m-1 ${language === lng.code ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => handleLanguageChange(lng.code)}
                >
                  {lng.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <FileUploader
            onDataLoaded={handleDataLoaded}
            onTTSLanguageChange={handleTTSLanguageChange}
            onSelectedLanguageChange={handleSelectedLanguageChange} // Добавляем новый пропс
            data={data}
            firstElement={firstElement}
            setFirstElement={setFirstElement}
            ttsLanguage={ttsLanguage}
            selectedLanguage={selectedLanguage} // Передаем selectedLanguage
            languages={languages}
          />

          <DictionaryPlayer
            data={data}
            firstElement={firstElement}
            updateFirstElement={setFirstElement}
            ttsLanguage={ttsLanguage}
            selectedLanguage={selectedLanguage}
            onTTSLanguageChange={handleTTSLanguageChange}
            onSelectedLanguageChange={handleSelectedLanguageChange}
            languages={languages}
            supportedLanguages={supportedLanguages}
            onMarkAsLearned={handleMarkAsLearned}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
          />

          <Relax />

          <LearningComponent
            data={data}
            firstElement={firstElement}
            count={count}
            updateData={setData}
            language={ttsLanguage}
            setFirstElement={setFirstElement}
          />

          <NavigationComponent
            data={data}
            firstElement={firstElement}
            setFirstElement={setFirstElement}
            count={count}
            setCount={setCount}
          />

          <Tips />

          <div className="d-flex justify-content-between align-items-start my-4">
            <div className="d-flex flex-column align-items-start px-2 pe-3">
              <p className="mb-3 fs-6 lh-sm fw-semibold fst-italic">{t("telegram")}</p>
              <a href={telegramLink} target="_blank" rel="noopener noreferrer" className="rounded-4 p-2 bg-telegram-blue">
                <FaTelegramPlane size={32} color="white" />
              </a>
            </div>

            <div>
              <p className="mb-3 fs-6 lh-sm fw-semibold fst-italic">{t("share")}</p>
              <div className="rounded-1 p-2 pb-1 bg-white d-inline-block">
                <QRCodeCanvas value={appUrl} size={128} />
              </div>
            </div>
          </div>

          <CookieConsent
            location="bottom"
            buttonText={t("cookie.acceptButton")}
            cookieName="cookieConsent"
            style={{ background: "#333" }}
            buttonClasses="btn btn-sm rounded-2"
            buttonStyle={{ color: "#333", backgroundColor: "#ffc800" }}
          >
            <Trans i18nKey="cookie.message">
              This website uses cookies to ensure the best user experience. Please review our
              <a className="policy-link" href={privacyPolicyPath} target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
            </Trans>
          </CookieConsent>
        </div>
      </div>

    </div>
  );
};

export default App;