import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FileUploader from './components/FileUploader';
import LearningComponent from './components/LearningComponent';
import NavigationComponent from './components/NavigationComponent';

const App = () => {
  const { i18n } = useTranslation();  // const { t, i18n } = useTranslation();

  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('data');
    return savedData ? JSON.parse(savedData) : [];
  });

  const [firstElement, setFirstElement] = useState(() => {
    const savedFirstElement = localStorage.getItem('firstElement');
    return savedFirstElement ? JSON.parse(savedFirstElement) : 0;
  });

  const [language, setLanguage] = useState(() => {
    // При загрузке проверяем сохранённый язык или используем язык браузера
    return localStorage.getItem('selectedLanguage') || navigator.language.slice(0, 2) || 'en';
  });

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

  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('firstElement', JSON.stringify(firstElement));
  }, [firstElement]);

  // Эффект для автоматической установки языка при первой загрузке
  useEffect(() => {
    const storedLanguage = localStorage.getItem('selectedLanguage');
    const defaultLanguage = storedLanguage || navigator.language.slice(0, 2) || 'en';
    i18n.changeLanguage(defaultLanguage);
    setLanguage(defaultLanguage);
  }, [i18n]);

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-7">

          <div className="d-flex pt-2 pb-0 ps-2 pe-2 pb-0 mb-0">
            <div className="logo h4 pt-1 mb-0 fw-bold">Lingua <br />Puzzle</div>
            <div className="flex-grow-1 text-end">
              {/* Кнопки языков с динамическим классом для активного языка */}
              {['en', 'de', 'fr', 'it', 'es', 'pt', 'pl', 'cs', 'uk', 'sh', 'ru', 'tr', 'ar', 'fa'].map((lng) => (
                <button
                  key={lng}
                  className={`btn btn-sm rounded-pill m-1 ${
                    language === lng ? 'btn-dark' : 'btn-outline-dark'
                  }`}
                  onClick={() => handleLanguageChange(lng)}
                >
                  {lng.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <FileUploader onDataLoaded={handleDataLoaded} onLanguageChange={handleLanguageChange} />
          <LearningComponent data={data} firstElement={firstElement} count={count} updateData={setData} language={language} />
          <NavigationComponent
            data={data}
            firstElement={firstElement}
            setFirstElement={setFirstElement}
            count={count}
            language={language}
          />
        </div>
      </div>
    </div>
  );
};

export default App;