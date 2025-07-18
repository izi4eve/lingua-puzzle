import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaPause, FaPlay } from 'react-icons/fa';
import { TbCircleNumber2Filled, TbPlayerTrackNextFilled, TbPlayerTrackPrevFilled } from 'react-icons/tb';
import Title from './Title';
import PreventScreenSleep from './PreventScreenSleep';

// Приоритетные голоса для каждого языка (можно расширить)
const voicePriority = {
  'de-DE': ['Petra (Premium)', 'Anna', 'Eddy (Немецкий (Германия))', 'Flo (Немецкий (Германия))'],
  'en-US': ['Samantha', 'Ava (Premium)', 'Joelle (Enhanced)', 'Alex'],
  'fr-FR': ['Amélie', 'Thomas', 'Jacques'],
  'it-IT': ['Alice', 'Eddy (Итальянский (Италия))'],
  'es-ES': ['Mónica', 'Eddy (Испанский (Испания))'],
  'pt-PT': ['Joana', 'Luciana'],
  'pl-PL': ['Zosia'],
  'cs-CZ': ['Zuzana'],
  'ru-RU': ['Milena (Enhanced)', 'Milena'],
  // Добавьте другие языки по необходимости
};

const DictionaryPlayer = ({
  data,
  firstElement,
  updateFirstElement,
  ttsLanguage,
  selectedLanguage,
  onTTSLanguageChange,
  onSelectedLanguageChange,
  languages,
  supportedLanguages,
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
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [delayBetweenRecords, setDelayBetweenRecords] = useState(2); // Новый параметр задержки
  const [isInDelay, setIsInDelay] = useState(false); // Состояние задержки

  // Refs для отслеживания изменений во время воспроизведения
  const delayTimeoutRef = useRef(null);
  const isPlayingRef = useRef(isPlaying);
  const currentSettingsRef = useRef({
    readingSpeed,
    repeatCount,
    delayBetweenRecords,
    selectedVoice,
  });

  // Обновляем refs при изменении состояний
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    currentSettingsRef.current = {
      readingSpeed,
      repeatCount,
      delayBetweenRecords,
      selectedVoice,
    };
  }, [readingSpeed, repeatCount, delayBetweenRecords, selectedVoice]);

  const filteredData = data.filter((item) => !item.isLearned);
  const maxIndex = Math.max(0, filteredData.length - 1);

  // Функция для очистки таймаута задержки
  const clearDelayTimeout = useCallback(() => {
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
      setIsInDelay(false);
    }
  }, []);

  // Загрузка доступных голосов
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);
      console.log('Доступные голоса:', voices.map(v => ({ name: v.name, lang: v.lang, default: v.default })));

      // Выбираем лучший голос для ttsLanguage
      const priorityVoices = voicePriority[ttsLanguage] || [];
      const bestVoice = voices.find(v => priorityVoices.includes(v.name) && v.lang === ttsLanguage) ||
        voices.find(v => v.lang === ttsLanguage && !v.default) ||
        voices.find(v => v.lang === ttsLanguage) ||
        voices.find(v => v.default); // Запасной вариант
      setSelectedVoice(bestVoice ? bestVoice.name : null);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // Первичная загрузка
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [ttsLanguage]);

  // Очистка при изменении данных
  useEffect(() => {
    window.speechSynthesis.cancel();
    clearDelayTimeout();
    setCurrentRecord(firstElement);
    setInputValue(firstElement.toString());
  }, [data, firstElement, clearDelayTimeout]);

  // Проверка поддержки Web Speech API
  useEffect(() => {
    if (!window.speechSynthesis) {
      alert(t('speech-synthesis-not-supported'));
    }
  }, [t]);

  // Загрузка сохранённых настроек
  useEffect(() => {
    const savedSettings = localStorage.getItem('playerSettings');
    if (savedSettings) {
      const { readingSpeed, repeatCount, recordsToPlay, selectedVoice, delayBetweenRecords } = JSON.parse(savedSettings);
      setReadingSpeed(readingSpeed ?? 0.75);
      setRepeatCount(repeatCount ?? 3);
      setRecordsToPlay(recordsToPlay ?? 'all');
      setSelectedVoice(selectedVoice ?? null);
      setDelayBetweenRecords(delayBetweenRecords ?? 2);
    }
  }, []);

  // Сохранение настроек (теперь включает selectedVoice и delayBetweenRecords)
  useEffect(() => {
    localStorage.setItem('playerSettings', JSON.stringify({
      selectedLanguage,
      readingSpeed,
      repeatCount,
      recordsToPlay,
      selectedVoice,
      delayBetweenRecords,
    }));
  }, [selectedLanguage, readingSpeed, repeatCount, recordsToPlay, selectedVoice, delayBetweenRecords]);

  // Функция задержки с возможностью отмены
  const delayWithCancel = useCallback((seconds) => {
    return new Promise((resolve, reject) => {
      setIsInDelay(true);
      delayTimeoutRef.current = setTimeout(() => {
        delayTimeoutRef.current = null;
        setIsInDelay(false);
        if (isPlayingRef.current) {
          resolve();
        } else {
          reject(new Error('Playback stopped during delay'));
        }
      }, seconds * 1000);
    });
  }, []);

  const playAudio = useCallback(async (text, lang, useReadingSpeed = false) => {
    if (!window.speechSynthesis) {
      console.error('SpeechSynthesis is not supported.');
      return Promise.reject(new Error('SpeechSynthesis is not supported.'));
    }

    return new Promise((resolve, reject) => {
      try {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = useReadingSpeed ? currentSettingsRef.current.readingSpeed : 1.0;

        // Выбор голоса
        if (currentSettingsRef.current.selectedVoice) {
          const voice = availableVoices.find(v => v.name === currentSettingsRef.current.selectedVoice && v.lang === lang);
          if (voice) {
            utterance.voice = voice;
            console.log(`Выбран голос: ${voice.name} для языка ${lang}`);
          } else {
            console.warn(`Голос ${currentSettingsRef.current.selectedVoice} не найден для языка ${lang}`);
          }
        }

        utterance.onend = () => {
          console.log(`playAudio completed: ${text}, rate=${utterance.rate}`);
          resolve();
        };
        utterance.onerror = (e) => {
          console.error(`playAudio error: ${text}`, e);
          reject(e);
        };
        console.log(`playAudio started: ${text}, lang=${lang}, rate=${utterance.rate}, voice=${utterance.voice?.name || 'default'}`);
        window.speechSynthesis.speak(utterance);
      } catch (error) {
        console.error(`playAudio exception: ${text}`, error);
        reject(error);
      }
    });
  }, [availableVoices]);

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
      clearDelayTimeout();
      return;
    }

    setIsSpeaking(true);
    const { foreignPart, translation } = filteredData[currentRecord];

    try {
      await playAudio(translation, selectedLanguage, true);

      // Проверяем, не остановлено ли воспроизведение
      if (!isPlayingRef.current) {
        setIsSpeaking(false);
        return;
      }

      await playAudio(foreignPart, ttsLanguage, true);

      // Проверяем, не остановлено ли воспроизведение
      if (!isPlayingRef.current) {
        setIsSpeaking(false);
        return;
      }

      setIsSpeaking(false);
      const nextRepeat = currentRepeat + 1;
      console.log(`setCurrentRepeat: prev=${currentRepeat}, nextRepeat=${nextRepeat}, repeatCount=${currentSettingsRef.current.repeatCount}`);

      if (nextRepeat < currentSettingsRef.current.repeatCount) {
        setCurrentRepeat(nextRepeat);
        // Без задержки между повторами одной записи - сразу переходим к следующему повтору
      } else {
        setCurrentRepeat(0);
        // Задержка только перед переходом к следующей записи
        await delayWithCancel(currentSettingsRef.current.delayBetweenRecords);
        handleNext();
      }
    } catch (error) {
      console.error('Ошибка воспроизведения аудио:', error);
      setIsSpeaking(false);
      setIsInDelay(false);
      if (error.message !== 'Playback stopped during delay') {
        setIsPlaying(false);
      }
    }
  }, [
    currentRecord,
    maxIndex,
    filteredData,
    selectedLanguage,
    ttsLanguage,
    handleNext,
    isPlaying,
    isSpeaking,
    currentRepeat,
    playAudio,
    delayWithCancel,
    clearDelayTimeout,
  ]);

  useEffect(() => {
    console.log(`useEffect воспроизведения: isPlaying=${isPlaying}, filteredData.length=${filteredData.length}, currentRecord=${currentRecord}, currentRepeat=${currentRepeat}`);
    if (isPlaying && filteredData.length > 0 && !isSpeaking && !isInDelay) {
      playCurrentRecord();
    } else if (filteredData.length === 0) {
      setIsPlaying(false);
    }
  }, [isPlaying, filteredData.length, currentRecord, currentRepeat, isSpeaking, isInDelay, playCurrentRecord]);

  useEffect(() => {
    if (!isPlaying) return;

    const checkSynthesis = () => {
      if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
        console.log('speechSynthesis active');
      } else if (isPlaying && !isSpeaking && !isInDelay) {
        console.log('speechSynthesis stopped unexpectedly, restarting...');
        playCurrentRecord();
      }
    };

    const interval = setInterval(checkSynthesis, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, isSpeaking, isInDelay, playCurrentRecord]);

  const handlePlayPause = useCallback(() => {
    console.log(`handlePlayPause: isPlaying=${isPlaying}`);
    if (isPlaying) {
      window.speechSynthesis.cancel();
      clearDelayTimeout();
      setIsPlaying(false);
      setIsSpeaking(false);
      setCurrentRepeat(0);
    } else {
      setIsPlaying(true);
    }
  }, [isPlaying, clearDelayTimeout]);

  const handlePrev = useCallback(() => {
    console.log(`handlePrev: currentRecord=${currentRecord}`);
    window.speechSynthesis.cancel();
    clearDelayTimeout();
    setIsSpeaking(false);
    setCurrentRepeat(0);
    const prevRecord = Math.max(currentRecord - 1, 0);
    setCurrentRecord(prevRecord);
    updateFirstElement(prevRecord);
  }, [currentRecord, updateFirstElement, clearDelayTimeout]);

  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleGo = () => {
    const value = Math.max(0, Math.min(Number(inputValue), maxIndex));
    setCurrentRecord(value);
    updateFirstElement(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleGo();
  };

  // Обработчики изменения параметров во время воспроизведения
  const handleReadingSpeedChange = (e) => {
    setReadingSpeed(Number(e.target.value));
  };

  const handleRepeatCountChange = (e) => {
    setRepeatCount(Number(e.target.value));
  };

  const handleDelayChange = (e) => {
    setDelayBetweenRecords(Number(e.target.value));
  };

  const handleVoiceChange = (e) => {
    setSelectedVoice(e.target.value);
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
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('learning-language')}</label>
          <Form.Select
            value={ttsLanguage.split('-')[0]}
            onChange={(e) => {
              const selectedLang = languages.find(lang => lang.code.split('-')[0] === e.target.value);
              onTTSLanguageChange(selectedLang?.code || 'en-US');
            }}
            className="ms-2 w-auto"
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('voice')}</label>
          <Form.Select
            value={selectedVoice || ''}
            onChange={handleVoiceChange}
            className="ms-2 w-auto"
          >
            <option value="">{t('default-voice')}</option>
            {availableVoices
              .filter((voice) => voice.lang === ttsLanguage)
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.default ? `(${t('default')})` : ''}
                </option>
              ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('reading-speed')}</label>
          <Form.Select
            value={readingSpeed}
            onChange={handleReadingSpeedChange}
            className="ms-2 w-auto"
          >
            {[0.25, 0.5, 0.75, 1, 1.25, 1.5].map((speed) => (
              <option key={speed} value={speed}>{speed}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('repeat-each-record')}</label>
          <Form.Select
            value={repeatCount}
            onChange={handleRepeatCountChange}
            className="ms-2 w-auto"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
              <option key={count} value={count}>{count}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('delay-between-records')}</label>
          <Form.Select
            value={delayBetweenRecords}
            onChange={handleDelayChange}
            className="ms-2 w-auto"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((seconds) => (
              <option key={seconds} value={seconds}>{seconds}</option>
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
              <span>{`${filteredData[currentRecord]?.translation}`} </span>
              {filteredData[currentRecord]?.tipPart && (
                <span className="tip-part"> = {filteredData[currentRecord].tipPart}</span>
              )}
            </p>
            <div className="d-flex gap-3">
              <div>{t('record')}: <span className="fw-bold">{currentRecord + 1}/{maxIndex + 1}</span></div>
              <div>{t('repeat')}: <span className="fw-bold">{currentRepeat + 1}/{repeatCount}</span></div>
              {isInDelay && <div className="text-warning">{t('delay')}</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPlayer;