import React, { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowRight } from 'react-icons/fa';
import { TbCircleNumber2Filled } from 'react-icons/tb';

import PlayerControls from './PlayerControls';
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
  onMarkAsLearned,
  onEditEntry,
  onDeleteEntry,
}) => {
  const { t } = useTranslation();

  const [currentRecord, setCurrentRecord] = useState(firstElement);
  const [repeatCount, setRepeatCount] = useState(3);
  const [readingSpeed, setReadingSpeed] = useState(0.5);
  const [inputValue, setInputValue] = useState(firstElement.toString());
  const [recordsToPlay, setRecordsToPlay] = useState('all');
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedVoiceYourLang, setSelectedVoiceYourLang] = useState(null);
  const [tipLanguage, setTipLanguage] = useState(selectedLanguage);
  const [selectedVoiceTip, setSelectedVoiceTip] = useState(null);
  const [delayBetweenRecords, setDelayBetweenRecords] = useState(2);

  const filteredData = data.filter((item) => !item.isLearned);
  const maxIndex = Math.max(0, filteredData.length - 1);

  // Загрузка доступных голосов
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Для изучаемого языка
      const ttsLangCode = languages.find(lang => lang.code.split('-')[0] === ttsLanguage)?.code || 'en-US';
      const priorityVoices = voicePriority[ttsLangCode] || [];
      const bestVoice = voices.find(v => priorityVoices.includes(v.name) && v.lang.startsWith(ttsLanguage)) ||
        voices.find(v => v.lang.startsWith(ttsLanguage) && !v.default) ||
        voices.find(v => v.lang.startsWith(ttsLanguage)) ||
        voices.find(v => v.default);
      setSelectedVoice(bestVoice ? bestVoice.name : null);

      // Для вашего языка
      const yourLangCode = languages.find(lang => lang.code.split('-')[0] === selectedLanguage)?.code || 'en-US';
      const priorityVoicesYourLang = voicePriority[yourLangCode] || [];
      const bestVoiceYourLang = voices.find(v => priorityVoicesYourLang.includes(v.name) && v.lang.startsWith(selectedLanguage)) ||
        voices.find(v => v.lang.startsWith(selectedLanguage) && !v.default) ||
        voices.find(v => v.lang.startsWith(selectedLanguage)) ||
        voices.find(v => v.default);
      setSelectedVoiceYourLang(bestVoiceYourLang ? bestVoiceYourLang.name : null);

      // Для языка подсказки
      const tipLangCode = languages.find(lang => lang.code.split('-')[0] === tipLanguage)?.code || 'en-US';
      const priorityVoicesTip = voicePriority[tipLangCode] || [];
      const bestVoiceTip = voices.find(v => priorityVoicesTip.includes(v.name) && v.lang.startsWith(tipLanguage)) ||
        voices.find(v => v.lang.startsWith(tipLanguage) && !v.default) ||
        voices.find(v => v.lang.startsWith(tipLanguage)) ||
        voices.find(v => v.default);
      setSelectedVoiceTip(bestVoiceTip ? bestVoiceTip.name : null);
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [ttsLanguage, selectedLanguage, tipLanguage, languages]);

  // Обновление currentRecord при изменении firstElement
  useEffect(() => {
    setCurrentRecord(firstElement);
    setInputValue(firstElement.toString());
  }, [firstElement]);

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
      const { readingSpeed, repeatCount, recordsToPlay, selectedVoice, selectedVoiceYourLang, delayBetweenRecords, tipLanguage, selectedVoiceTip } = JSON.parse(savedSettings);
      setReadingSpeed(readingSpeed ?? 0.75);
      setRepeatCount(repeatCount ?? 3);
      setRecordsToPlay(recordsToPlay ?? 'all');
      setSelectedVoice(selectedVoice ?? null);
      setSelectedVoiceYourLang(selectedVoiceYourLang ?? null);
      setDelayBetweenRecords(delayBetweenRecords ?? 2);
      setTipLanguage(tipLanguage ?? selectedLanguage);
      setSelectedVoiceTip(selectedVoiceTip ?? null);
    }
  }, [selectedLanguage]);

  // Сохранение настроек
  useEffect(() => {
    localStorage.setItem('playerSettings', JSON.stringify({
      selectedLanguage,
      readingSpeed,
      repeatCount,
      recordsToPlay,
      selectedVoice,
      selectedVoiceYourLang,
      delayBetweenRecords,
      tipLanguage,
      selectedVoiceTip,
    }));
  }, [selectedLanguage, readingSpeed, repeatCount, recordsToPlay, selectedVoice, selectedVoiceYourLang, delayBetweenRecords, tipLanguage, selectedVoiceTip]);

  const handleInputChange = (e) => setInputValue(e.target.value);

  const handleGo = () => {
    const value = Math.max(0, Math.min(Number(inputValue), maxIndex));
    setCurrentRecord(value);
    updateFirstElement(value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleGo();
  };

  // Обработчики изменения параметров
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

  const handleVoiceYourLangChange = (e) => {
    setSelectedVoiceYourLang(e.target.value);
  };

  const handleTipLanguageChange = (value) => {
    setTipLanguage(value);
  };

  const handleVoiceTipChange = (e) => {
    setSelectedVoiceTip(e.target.value);
  };

  return (
    <div className="whiteBox rounded-4 p-3 my-3">
      <PreventScreenSleep />
      <Title icon={<TbCircleNumber2Filled size={28} />} text={t('listen-dictionary')} />

      <div className="d-flex flex-row flex-wrap column-gap-2 row-gap-1 mt-1">
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
          <label>{t('voice')}</label>
          <Form.Select
            value={selectedVoiceYourLang || ''}
            onChange={handleVoiceYourLangChange}
            className="ms-2 w-auto"
          >
            <option value="">{t('default-voice')}</option>
            {availableVoices
              .filter((voice) => voice.lang.startsWith(selectedLanguage))
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.default ? `(${t('default')})` : ''}
                </option>
              ))}
          </Form.Select>
        </div>

        <div className="w-100"></div>

        <div className="d-flex align-items-center">
          <label>{t('learning-language')}</label>
          <Form.Select
            value={ttsLanguage.split('-')[0]}
            onChange={(e) => onTTSLanguageChange(e.target.value)}
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
              .filter((voice) => voice.lang.startsWith(ttsLanguage))
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.default ? `(${t('default')})` : ''}
                </option>
              ))}
          </Form.Select>
        </div>

        <div className="w-100"></div>

        <div className="d-flex align-items-center">
          <label>{t('tip-language')}</label>
          <Form.Select
            value={tipLanguage}
            onChange={(e) => handleTipLanguageChange(e.target.value)}
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
            value={selectedVoiceTip || ''}
            onChange={handleVoiceTipChange}
            className="ms-2 w-auto"
          >
            <option value="">{t('default-voice')}</option>
            {availableVoices
              .filter((voice) => voice.lang.startsWith(tipLanguage))
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.default ? `(${t('default')})` : ''}
                </option>
              ))}
          </Form.Select>
        </div>

        <div className="w-100"></div>

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

      <div className="w-100 pt-4"></div>

      {/* Используем компонент PlayerControls */}
      <PlayerControls
        data={data}
        firstElement={firstElement}
        updateFirstElement={updateFirstElement}
        ttsLanguage={ttsLanguage}
        selectedLanguage={selectedLanguage}
        languages={languages}
        onMarkAsLearned={onMarkAsLearned}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
        readingSpeed={readingSpeed}
        repeatCount={repeatCount}
        selectedVoice={selectedVoice}
        selectedVoiceYourLang={selectedVoiceYourLang}
        tipLanguage={tipLanguage}
        selectedVoiceTip={selectedVoiceTip}
        delayBetweenRecords={delayBetweenRecords}
        availableVoices={availableVoices}
      />

      <div className="mt-3">
        {filteredData.length > 0 && (
          <div>
            <div className="d-flex gap-3">
              <div>{t('record')}: <span className="fw-bold">{currentRecord + 1}/{maxIndex + 1}</span></div>
              {/* <div>{t('repeat')}: <span className="fw-bold">1/{repeatCount}</span></div> */}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPlayer;