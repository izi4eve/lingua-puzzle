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

  // Данные словаря
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('data');
    return savedData ? JSON.parse(savedData) : [];
  });

  const [firstElement, setFirstElement] = useState(() => {
    const savedFirstElement = localStorage.getItem('firstElement');
    return savedFirstElement ? JSON.parse(savedFirstElement) : 0;
  });

  // ЯЗЫКИ ИНТЕРФЕЙСА
  const supportedUILanguages = useMemo(() => [
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

  // ЯЗЫКИ КОНТЕНТА
  const supportedContentLanguages = useMemo(() => [
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

  // TTS языки для speechSynthesis
  const ttsLanguages = useMemo(() => [
    { name: 'English', code: 'en-US' },
    { name: 'Deutsch', code: 'de-DE' },
    { name: 'Français', code: 'fr-FR' },
    { name: 'Italiano', code: 'it-IT' },
    { name: 'Español', code: 'es-ES' },
    { name: 'Português', code: 'pt-PT' },
    { name: 'Polski', code: 'pl-PL' },
    { name: 'Čeština', code: 'cs-CZ' },
    { name: 'Русский', code: 'ru-RU' },
    { name: 'Українська', code: 'uk-UA' },
    { name: 'Türkçe', code: 'tr-TR' },
  ], []);

  // 1. ЯЗЫК ИНТЕРФЕЙСА
  const [uiLanguage, setUILanguage] = useState(() => {
    return localStorage.getItem('uiLanguage') || 'en';
  });

  // 2. ЯЗЫК ИЗУЧАЕМЫХ СЛОВ (foreignPart)
  const [foreignLanguage, setForeignLanguage] = useState(() => {
    return localStorage.getItem('foreignLanguage') || 'de';
  });

  // 3. ЯЗЫК ПЕРЕВОДОВ (translation)
  const [translationLanguage, setTranslationLanguage] = useState(() => {
    return localStorage.getItem('translationLanguage') || 'en';
  });

  // 4. ЯЗЫК ПОДСКАЗОК (tipPart)
  const [tipLanguage, setTipLanguage] = useState(() => {
    return localStorage.getItem('tipLanguage') || 'en';
  });

  // Настройки плеера
  const [playerSettings, setPlayerSettings] = useState({
    repeatCount: 3,
    readingSpeed: 0.5,
    selectedVoice: null,
    selectedVoiceYourLang: null,
    selectedVoiceTip: null,
    delayBetweenRecords: 2,
    availableVoices: [],
  });

  const privacyPolicyPath = uiLanguage === 'en' ? '/policies/privacy-policy.md' : `/policies/privacy-policy.${uiLanguage}.md`;

  const [count, setCount] = useState(() => {
    const savedCount = localStorage.getItem('count');
    return savedCount ? JSON.parse(savedCount) : 5;
  });

  // Сохранение в localStorage
  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('firstElement', JSON.stringify(firstElement));
  }, [firstElement]);

  useEffect(() => {
    localStorage.setItem('count', JSON.stringify(count));
  }, [count]);

  useEffect(() => {
    localStorage.setItem('uiLanguage', uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    localStorage.setItem('foreignLanguage', foreignLanguage);
  }, [foreignLanguage]);

  useEffect(() => {
    localStorage.setItem('translationLanguage', translationLanguage);
  }, [translationLanguage]);

  useEffect(() => {
    localStorage.setItem('tipLanguage', tipLanguage);
  }, [tipLanguage]);

  // Обработчики
  const handleDataLoaded = (loadedData) => {
    setFirstElement(0);
    setData(loadedData);
  };

  // ОБРАБОТЧИК СМЕНЫ ЯЗЫКА ИНТЕРФЕЙСА
  const handleUILanguageChange = (newLanguage) => {
    setUILanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  };

  // ОБРАБОТЧИКИ СМЕНЫ ЯЗЫКОВ КОНТЕНТА
  const handleForeignLanguageChange = (newLanguage) => {
    setForeignLanguage(newLanguage);
  };

  const handleTranslationLanguageChange = (newLanguage) => {
    setTranslationLanguage(newLanguage);
  };

  const handleTipLanguageChange = (newLanguage) => {
    setTipLanguage(newLanguage);
  };

  // ОБРАБОТЧИК ОПРЕДЕЛЕНИЯ ЯЗЫКОВ ИЗ НАЗВАНИЯ ФАЙЛА
  const handleLanguagesFromFileName = (sourceLang, targetLang) => {
    if (sourceLang && targetLang) {
      setForeignLanguage(sourceLang);
      setTranslationLanguage(targetLang);
      setTipLanguage(targetLang); // По умолчанию tipLanguage = translationLanguage
    }
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

  const handlePlayerSettingsChange = (settings) => {
    setPlayerSettings(settings);
  };

  // Инициализация языка интерфейса при первом запуске
  useEffect(() => {
    const savedUILanguage = localStorage.getItem('uiLanguage');

    if (!savedUILanguage) {
      const browserLanguage = navigator.language.split('-')[0];
      const defaultLanguage = supportedUILanguages.find(lang => lang.code === browserLanguage)?.code || 'en';
      setUILanguage(defaultLanguage);
      i18n.changeLanguage(defaultLanguage);
    } else {
      i18n.changeLanguage(savedUILanguage);
    }
  }, [i18n, supportedUILanguages]);

  useEffect(() => {
    // Отправляем событие page_view при загрузке приложения
    if (window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: window.location.pathname + window.location.search,
      });
    }
  }, []);

  return (
    <div className="container no-select">
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
              {supportedUILanguages.map((lng) => (
                <button
                  key={lng.code}
                  className={`btn btn-sm rounded-pill m-1 ${uiLanguage === lng.code ? 'btn-dark' : 'btn-outline-dark'}`}
                  onClick={() => handleUILanguageChange(lng.code)}
                >
                  {lng.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <FileUploader
            onDataLoaded={handleDataLoaded}
            onLanguagesFromFileName={handleLanguagesFromFileName}
            data={data}
            firstElement={firstElement}
            setFirstElement={setFirstElement}
            foreignLanguage={foreignLanguage}
            translationLanguage={translationLanguage}
            tipLanguage={tipLanguage}
            supportedContentLanguages={supportedContentLanguages}
            ttsLanguages={ttsLanguages}
          />

          <DictionaryPlayer
            data={data}
            firstElement={firstElement}
            updateFirstElement={setFirstElement}
            foreignLanguage={foreignLanguage}
            translationLanguage={translationLanguage}
            tipLanguage={tipLanguage}
            onForeignLanguageChange={handleForeignLanguageChange}
            onTranslationLanguageChange={handleTranslationLanguageChange}
            onTipLanguageChange={handleTipLanguageChange}
            supportedContentLanguages={supportedContentLanguages}
            ttsLanguages={ttsLanguages}
            onMarkAsLearned={handleMarkAsLearned}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            onPlayerSettingsChange={handlePlayerSettingsChange}
          />

          <Relax
            data={data}
            firstElement={firstElement}
            updateFirstElement={setFirstElement}
            foreignLanguage={foreignLanguage}
            translationLanguage={translationLanguage}
            tipLanguage={tipLanguage}
            onForeignLanguageChange={handleForeignLanguageChange}
            onTranslationLanguageChange={handleTranslationLanguageChange}
            onTipLanguageChange={handleTipLanguageChange}
            supportedContentLanguages={supportedContentLanguages}
            ttsLanguages={ttsLanguages}
            onMarkAsLearned={handleMarkAsLearned}
            onEditEntry={handleEditEntry}
            onDeleteEntry={handleDeleteEntry}
            repeatCount={playerSettings.repeatCount}
            readingSpeed={playerSettings.readingSpeed}
            selectedVoice={playerSettings.selectedVoice}
            selectedVoiceYourLang={playerSettings.selectedVoiceYourLang}
            selectedVoiceTip={playerSettings.selectedVoiceTip}
            delayBetweenRecords={playerSettings.delayBetweenRecords}
            availableVoices={playerSettings.availableVoices}
            recordsToPlay={playerSettings.recordsToPlay}
            onRequestPlayerPause={() => {
              if (window.dictionaryPlayerPause) {
                window.dictionaryPlayerPause();
              }
            }}
          />

          <LearningComponent
            data={data}
            firstElement={firstElement}
            count={count}
            updateData={setData}
            language={foreignLanguage} // Используем foreignLanguage для TTS
            setFirstElement={setFirstElement}
            // Передаем настройки озвучки из playerSettings
            selectedVoiceForeign={playerSettings.selectedVoice}
            readingSpeed={playerSettings.readingSpeed}
            availableVoices={playerSettings.availableVoices}
            ttsLanguages={ttsLanguages}
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