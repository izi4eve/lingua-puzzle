import React, { useState, useEffect } from 'react';
import FileUploader from './components/FileUploader';
import LearningComponent from './components/LearningComponent';
import NavigationComponent from './components/NavigationComponent';

const App = () => {
  const [data, setData] = useState(() => {
    const savedData = localStorage.getItem('data');
    return savedData ? JSON.parse(savedData) : [];
  });

  const [firstElement, setFirstElement] = useState(() => {
    const savedFirstElement = localStorage.getItem('firstElement');
    return savedFirstElement ? JSON.parse(savedFirstElement) : 0;
  });

  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('selectedLanguage') || 'en-US';
  });

  const count = 5;

  const handleDataLoaded = (loadedData) => {
    setFirstElement(0);
    setData(loadedData);
    console.log("data array: ", loadedData);
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('selectedLanguage', newLanguage);
  };

  useEffect(() => {
    localStorage.setItem('data', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    localStorage.setItem('firstElement', JSON.stringify(firstElement));
  }, [firstElement]);

  useEffect(() => {
    localStorage.setItem('selectedLanguage', language);
  }, [language]);

  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-12 col-md-10 col-lg-8 col-xl-7">
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