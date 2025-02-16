import React, { useState, useEffect } from 'react';
import * as bootstrap from "bootstrap";
import { Trans, useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import FileUploader from './components/FileUploader';
import LearningComponent from './components/LearningComponent';
import NavigationComponent from './components/NavigationComponent';
import DictionaryPlayer from './components/DictionaryPlayer';
import Tips from './components/Tips';
import CookieConsent from "react-cookie-consent";

const App = () => {
  const { t, i18n } = useTranslation();

  const appUrl = "https://izi4eve.github.io/lingua-puzzle/";

  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('data');
    return savedData ? JSON.parse(savedData) : [];
  });

  const [firstElement, setFirstElement] = useState(() => {
    const savedFirstElement = localStorage.getItem('firstElement');
    return savedFirstElement ? JSON.parse(savedFirstElement) : 0;
  });

  const supportedLanguages = ['en', 'de', 'fr', 'it', 'es', 'pt', 'pl', 'cs', 'uk', 'sh', 'ru', 'tr', 'ar', 'fa'];
  const [language, setLanguage] = useState(localStorage.getItem('selectedLanguage') || 'en');
  const [ttsLanguage, setTTSLanguage] = useState(localStorage.getItem('ttsLanguage') || 'en-US');

  const languages = [
    { name: 'English', code: 'en-US' },
    { name: 'Deutsch', code: 'de-DE' },
    { name: 'Français', code: 'fr-FR' },
    { name: 'Italiano', code: 'it-IT' },
    { name: 'Español', code: 'es-ES' },
    { name: 'Português', code: 'pt-PT' },
    { name: 'Polski', code: 'pl-PL' },
    { name: 'Čeština', code: 'cs-CZ' }
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

  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('firstElement', JSON.stringify(firstElement));

    // Запись даты окончания сеанса
    const today = new Date().toISOString().split('T')[0]; // Сохраняем только YYYY-MM-DD
    localStorage.setItem('lastSessionDate', today);
  }, [firstElement]);

  useEffect(() => {
    // Определяем язык браузера и выбираем его, если он поддерживается; иначе - английский
    const browserLanguage = navigator.language.split('-')[0];
    const savedLanguage = localStorage.getItem('selectedLanguage');

    if (!savedLanguage) {
      const defaultLanguage = supportedLanguages.includes(browserLanguage) ? browserLanguage : 'en';
      setLanguage(defaultLanguage);
      localStorage.setItem('selectedLanguage', defaultLanguage);
      i18n.changeLanguage(defaultLanguage);
    } else {
      i18n.changeLanguage(savedLanguage);
      setLanguage(savedLanguage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n]);

  useEffect(() => {
    const lastSessionDate = localStorage.getItem('lastSessionDate');
    const today = new Date().toLocaleDateString();
  
    if (lastSessionDate && lastSessionDate !== today) {
      const modalElement = document.getElementById("resetModal");
      if (modalElement) {
        const modalInstance = new bootstrap.Modal(modalElement);
        modalInstance.show();
      }
    }
  }, []);

  const handleResetYes = () => {
    setFirstElement(0);
  };

  return (
    <div
      className="container no-select"
    // onContextMenu={(e) => e.preventDefault()} // Disable the context menu
    >
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-7 overflow-hidden">

          <div className="d-flex pt-2 pb-0 overflow-hidden">
            <div className="logo h4 px-2 pt-1 mb-0 fw-bold">Lingua <br />Puzzle</div>
            <div className="flex-grow-1 px-2 text-end">
              {supportedLanguages.map((lng) => (
                <button
                  key={lng}
                  className={`btn btn-sm rounded-pill m-1 ${language === lng ? 'btn-dark' : 'btn-outline-dark'
                    }`}
                  onClick={() => handleLanguageChange(lng)}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <FileUploader
            onDataLoaded={handleDataLoaded}
            onTTSLanguageChange={handleTTSLanguageChange}
            data={data}
            firstElement={firstElement}
            setFirstElement={setFirstElement}
            ttsLanguage={ttsLanguage}
            languages={languages}
          />

          <LearningComponent
            data={data}
            firstElement={firstElement}
            count={count}
            updateData={setData}
            language={ttsLanguage}
          />

          <NavigationComponent
            data={data}
            firstElement={firstElement}
            setFirstElement={setFirstElement}
            count={count}
            setCount={setCount}
          />

          <DictionaryPlayer
            data={data}
            firstElement={firstElement}
            updateFirstElement={setFirstElement}
            ttsLanguage={ttsLanguage}
            onTTSLanguageChange={handleTTSLanguageChange}
            languages={languages}
          />

          <Tips />

          <div className="rounded-1 p-2 pb-1 my-4 bg-white d-inline-block float-end">
            <QRCodeCanvas value={appUrl} size={128} />
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

      <div className="modal fade" id="resetModal" tabIndex="-1" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{t("reset.title")}</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p>{t("reset.message")}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-danger" onClick={handleResetYes} data-bs-dismiss="modal">
                {t("yes")}
              </button>
              <button className="btn btn-secondary" data-bs-dismiss="modal">
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;