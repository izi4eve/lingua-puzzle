import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeCanvas } from 'qrcode.react';
import FileUploader from './components/FileUploader';
import LearningComponent from './components/LearningComponent';
import NavigationComponent from './components/NavigationComponent';
import Tips from './components/Tips';

const App = () => {
  const { i18n } = useTranslation();
  
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
  const count = 5;

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
  };

  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('firstElement', JSON.stringify(firstElement));
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

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-7">
          <div className="d-flex pt-2 pb-0 ps-2 pe-2 pb-0 mb-0">
            <div className="logo h4 pt-1 mb-0 fw-bold">Lingua <br />Puzzle</div>
            <div className="flex-grow-1 text-end">
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

          <FileUploader onDataLoaded={handleDataLoaded} onTTSLanguageChange={handleTTSLanguageChange} />
          <LearningComponent data={data} firstElement={firstElement} count={count} updateData={setData} language={ttsLanguage} />
          <NavigationComponent
            data={data}
            firstElement={firstElement}
            setFirstElement={setFirstElement}
            count={count}
            language={language}
          />

          <Tips />

          <div className="p-2 pb-1 my-4 bg-white d-inline-block float-end">
            <QRCodeCanvas value={appUrl} size={128} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;