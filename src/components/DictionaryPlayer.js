import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaPause, FaPlay } from "react-icons/fa";
import { TbCircleNumber2Filled, TbPlayerTrackNextFilled, TbPlayerTrackPrevFilled } from "react-icons/tb";
import Title from './Title';
import PreventScreenSleep from './PreventScreenSleep';

const DictionaryPlayer = ({
  data,
  firstElement,
  updateFirstElement,
  ttsLanguage,
  selectedLanguage,
  onTTSLanguageChange,
  onSelectedLanguageChange,
  languages,
}) => {
  const { t } = useTranslation();

  const [currentRecord, setCurrentRecord] = useState(firstElement);
  const [repeatCount, setRepeatCount] = useState(3);
  const [currentRepeat, setCurrentRepeat] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [readingSpeed, setReadingSpeed] = useState(0.5);
  const [inputValue, setInputValue] = useState(firstElement.toString());
  const [recordsToPlay, setRecordsToPlay] = useState('all');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const filteredData = data.filter((item) => !item.isLearned);
  const maxIndex = Math.max(0, filteredData.length - 1);

  useEffect(() => {
    window.speechSynthesis.cancel();
    setCurrentRecord(firstElement);
    setInputValue(firstElement.toString());
  }, [data, firstElement]);

  useEffect(() => {
    if (!window.speechSynthesis) {
      alert('SpeechSynthesis is not supported in your browser.');
    }
  }, []);

  useEffect(() => {
    const savedSettings = localStorage.getItem('playerSettings');
    if (savedSettings) {
      const { readingSpeed, repeatCount, recordsToPlay } = JSON.parse(savedSettings);
      setReadingSpeed(readingSpeed ?? 0.75); // Используем значение по умолчанию, если не задано
      setRepeatCount(repeatCount ?? 3); // Используем значение по умолчанию, если не задано
      setRecordsToPlay(recordsToPlay ?? 'all'); // Используем 'all', если значение не задано
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('playerSettings', JSON.stringify({
      selectedLanguage,
      readingSpeed,
      repeatCount,
      recordsToPlay,
    }));
  }, [selectedLanguage, readingSpeed, repeatCount, recordsToPlay]);

  const playAudio = useCallback(async (text, lang, useReadingSpeed = false) => {
    if (!window.speechSynthesis) {
      console.error('SpeechSynthesis is not supported.');
      return Promise.reject(new Error('SpeechSynthesis is not supported.'));
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = useReadingSpeed ? readingSpeed : 1.0; // Фиксированная скорость для translation
        utterance.onend = () => {
          console.log(`playAudio completed: ${text}, rate=${utterance.rate}`);
          resolve();
        };
        utterance.onerror = (e) => {
          console.error(`playAudio error: ${text}`, e);
          reject(e);
        };
        console.log(`playAudio started: ${text}, lang=${lang}, rate=${utterance.rate}`);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error(`playAudio exception: ${text}`, error);
        reject(error);
      }
    });
  }, [readingSpeed]);

  const handleNext = useCallback(() => {
    console.log(`handleNext: currentRecord=${currentRecord}`);
    const nextRecord = currentRecord + 1;
    const maxRecordToPlay = recordsToPlay === Infinity ? maxIndex : Math.min(maxIndex, recordsToPlay - 1);
    if (nextRecord > maxRecordToPlay) {
      setCurrentRecord(0);
      updateFirstElement(0);
    } else {
      setCurrentRecord(nextRecord);
      updateFirstElement(nextRecord);
    }
    setCurrentRepeat(0);
  }, [currentRecord, maxIndex, recordsToPlay, updateFirstElement]);

  const playCurrentRecord = useCallback(async () => {
    console.log(`playCurrentRecord: currentRecord=${currentRecord}, currentRepeat=${currentRepeat}, isPlaying=${isPlaying}, isSpeaking=${isSpeaking}`);
    if (
      !window.speechSynthesis ||
      filteredData.length === 0 ||
      currentRecord < 0 ||
      currentRecord > maxIndex ||
      !isPlaying ||
      isSpeaking
    ) {
      console.log('Остановка воспроизведения:', {
        speechSynthesis: !!window.speechSynthesis,
        filteredDataLength: filteredData.length,
        currentRecord,
        maxIndex,
        isPlaying,
        isSpeaking,
      });
      setIsSpeaking(false);
      setIsPlaying(false);
      return;
    }

    setIsSpeaking(true);
    const { foreignPart, translation } = filteredData[currentRecord];

    try {
      // await playAudio(translation, selectedLanguage, false); // Без readingSpeed
      await playAudio(translation, selectedLanguage, true); // С readingSpeed
      await playAudio(foreignPart, ttsLanguage, true); // С readingSpeed
      setIsSpeaking(false);
      const nextRepeat = currentRepeat + 1;
      console.log(`setCurrentRepeat: prev=${currentRepeat}, nextRepeat=${nextRepeat}, repeatCount=${repeatCount}`);
      if (nextRepeat < repeatCount) {
        setCurrentRepeat(nextRepeat);
      } else {
        setCurrentRepeat(0);
        handleNext();
      }
    } catch (error) {
      console.error("Ошибка воспроизведения аудио:", error);
      setIsSpeaking(false);
      setIsPlaying(false);
    }
  }, [
    currentRecord,
    maxIndex,
    filteredData,
    selectedLanguage,
    ttsLanguage,
    repeatCount,
    handleNext,
    isPlaying,
    isSpeaking,
    currentRepeat,
    playAudio,
  ]);

  useEffect(() => {
    console.log(`useEffect воспроизведения: isPlaying=${isPlaying}, filteredData.length=${filteredData.length}, currentRecord=${currentRecord}, currentRepeat=${currentRepeat}`);
    if (isPlaying && filteredData.length > 0 && !isSpeaking) {
      playCurrentRecord();
    } else if (filteredData.length === 0) {
      setIsPlaying(false);
    }
  }, [isPlaying, filteredData.length, currentRecord, currentRepeat, isSpeaking, playCurrentRecord]);

  // Проверка активности speechSynthesis в Safari
  useEffect(() => {
    if (!isPlaying) return;

    const checkSynthesis = () => {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        console.log('speechSynthesis active');
      } else if (isPlaying && !isSpeaking) {
        console.log('speechSynthesis stopped unexpectedly, restarting...');
        playCurrentRecord();
      }
    };

    const interval = setInterval(checkSynthesis, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isSpeaking, playCurrentRecord]);

  const handlePlayPause = useCallback(() => {
    console.log(`handlePlayPause: isPlaying=${isPlaying}`);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      setIsSpeaking(false);
      setCurrentRepeat(0);
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handlePrev = useCallback(() => {
    console.log(`handlePrev: currentRecord=${currentRecord}`);
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setCurrentRepeat(0);
    const prevRecord = Math.max(currentRecord - 1, 0);
    setCurrentRecord(prevRecord);
    updateFirstElement(prevRecord);
  }, [currentRecord, updateFirstElement]);

  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleGo = () => {
    const value = Math.max(0, Math.min(Number(inputValue), maxIndex));
    setCurrentRecord(value);
    updateFirstElement(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleGo();
  };

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: 'Dictionary Player',
        artist: 'Language Learning',
        album: 'Your App',
        artwork: [
          { src: 'icon.png', sizes: '96x96', type: 'image/png' },
          { src: 'icon-large.png', sizes: '512x512', type: 'image/png' },
        ],
      });
      navigator.mediaSession.setActionHandler('play', handlePlayPause);
      navigator.mediaSession.setActionHandler('pause', handlePlayPause);
      navigator.mediaSession.setActionHandler('nexttrack', handleNext);
      navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
    }
  }, [handlePlayPause, handleNext, handlePrev]);

  return (
    <div className="whiteBox rounded-4 p-3 my-3">
      <PreventScreenSleep isPlaying={isPlaying} />
      <Title icon={<TbCircleNumber2Filled size={28} />} text={t('listen-dictionary')} />

      <div className="d-flex flex-row flex-wrap gap-2">
        <div className="d-flex align-items-center">
          <label>{t('your-language')}</label>
          <Form.Select
            value={selectedLanguage}
            onChange={(e) => onSelectedLanguageChange(e.target.value)}
            className="ms-2 w-auto"
          >
            {['en', 'de', 'fr', 'it', 'es', 'pt', 'pl', 'cs', 'uk', 'sh', 'ru', 'tr', 'ar', 'fa'].map((lang) => (
              <option key={lang} value={lang}>{lang.toUpperCase()}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('learning-language')}</label>
          <Form.Select
            value={ttsLanguage}
            onChange={(e) => onTTSLanguageChange(e.target.value)}
            className="ms-2 w-auto"
          >
            {languages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('reading-speed')}</label>
          <Form.Select
            value={readingSpeed}
            onChange={(e) => setReadingSpeed(Number(e.target.value))}
            className="ms-2 w-auto"
          >
            {[0.25, 0.5, 0.75, 1].map((speed) => (
              <option key={speed} value={speed}>{speed}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('repeat-each-record')}</label>
          <Form.Select
            value={repeatCount}
            onChange={(e) => setRepeatCount(Number(e.target.value))}
            className="ms-2 w-auto"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('records-to-play')}</label>
          <Form.Select
            value={recordsToPlay === Infinity ? 'all' : recordsToPlay}
            onChange={(e) => {
              const value = e.target.value === 'all' ? Infinity : Number(e.target.value);
              setRecordsToPlay(value);
            }}
            className="ms-2 w-auto"
          >
            {[10, 20, 30, 50, 100, 200, 300, 500, 1000, 1500, 2000, 2500, 3000, 'all'].map((count) => (
              <option key={count} value={count === 'all' ? 'all' : count}>
                {count === 'all' ? t('all') : count}
              </option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('current-record')}</label>
          <div className="btn-group">
            <Form.Control
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyUp={handleKeyPress}
              className="ms-2 rounded-start index-field"
            />
            <Button onClick={handleGo} variant="outline-dark">
              <FaArrowRight />
            </Button>
          </div>
        </div>
      </div>

      <div className="btn-group mt-3">
        <button className="btn btn-lg rounded-start-pill btn-outline-dark pt-1" onClick={handlePrev}>
          <TbPlayerTrackPrevFilled />
        </button>
        <button className="btn btn-lg btn-dark pt-1" onClick={handlePlayPause}>
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
        <button className="btn btn-lg rounded-end-circle btn-outline-dark pt-1" onClick={handleNext}>
          <TbPlayerTrackNextFilled />
        </button>
      </div>

      <div className="mt-3">
        {filteredData.length > 0 && (
          <div>
            <p className="fs-5 fw-bold">
              <span className="text-success">{`${filteredData[currentRecord]?.foreignPart}`}</span>
              <span> = </span>
              <span>{`${filteredData[currentRecord]?.translation}`}</span>
            </p>
            <div className="d-flex gap-3">
              <div>{t('record')}: <span className="fw-bold">{currentRecord + 1}/{maxIndex + 1}</span></div>
              <div>{t('repeat')}: <span className="fw-bold">{currentRepeat + 1}/{repeatCount}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPlayer;