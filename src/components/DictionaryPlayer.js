import React, { useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowRight } from 'react-icons/fa';
import { TbCircleNumber2Filled } from 'react-icons/tb';

import PlayerControls from './PlayerControls';
import { PlayerProvider } from './PlayerContext';
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
  onPlayerSettingsChange,
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
  
  // Флаги для отслеживания того, были ли голоса выбраны пользователем вручную
  const [voiceManuallySelected, setVoiceManuallySelected] = useState(false);
  const [voiceYourLangManuallySelected, setVoiceYourLangManuallySelected] = useState(false);
  const [voiceTipManuallySelected, setVoiceTipManuallySelected] = useState(false);

  const filteredData = data.filter((item) => !item.isLearned);
  const maxIndex = Math.max(0, filteredData.length - 1);

  // Функция для поиска лучшего голоса
  const findBestVoice = (langCode, voices) => {
    const priorityVoices = voicePriority[langCode] || [];
    return voices.find(v => priorityVoices.includes(v.name) && v.lang.startsWith(langCode.split('-')[0])) ||
           voices.find(v => v.lang.startsWith(langCode.split('-')[0]) && !v.default) ||
           voices.find(v => v.lang.startsWith(langCode.split('-')[0])) ||
           voices.find(v => v.default);
  };

  // Загрузка доступных голосов
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Автоматический выбор голосов только если они не были выбраны пользователем вручную
      
      // Для изучаемого языка
      if (!voiceManuallySelected) {
        const ttsLangCode = languages.find(lang => lang.code.split('-')[0] === ttsLanguage)?.code || 'en-US';
        const bestVoice = findBestVoice(ttsLangCode, voices);
        setSelectedVoice(bestVoice ? bestVoice.name : null);
      }

      // Для вашего языка
      if (!voiceYourLangManuallySelected) {
        const yourLangCode = languages.find(lang => lang.code.split('-')[0] === selectedLanguage)?.code || 'en-US';
        const bestVoiceYourLang = findBestVoice(yourLangCode, voices);
        setSelectedVoiceYourLang(bestVoiceYourLang ? bestVoiceYourLang.name : null);
      }

      // Для языка подсказки
      if (!voiceTipManuallySelected) {
        const tipLangCode = languages.find(lang => lang.code.split('-')[0] === tipLanguage)?.code || 'en-US';
        const bestVoiceTip = findBestVoice(tipLangCode, voices);
        setSelectedVoiceTip(bestVoiceTip ? bestVoiceTip.name : null);
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [ttsLanguage, selectedLanguage, tipLanguage, languages, voiceManuallySelected, voiceYourLangManuallySelected, voiceTipManuallySelected]);

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
      const settings = JSON.parse(savedSettings);
      setReadingSpeed(settings.readingSpeed ?? 0.75);
      setRepeatCount(settings.repeatCount ?? 3);
      setRecordsToPlay(settings.recordsToPlay ?? 'all');
      setDelayBetweenRecords(settings.delayBetweenRecords ?? 2);
      setTipLanguage(settings.tipLanguage ?? selectedLanguage);
      
      // Если голоса были сохранены, значит они были выбраны пользователем
      if (settings.selectedVoice !== undefined) {
        setSelectedVoice(settings.selectedVoice);
        setVoiceManuallySelected(true);
      }
      if (settings.selectedVoiceYourLang !== undefined) {
        setSelectedVoiceYourLang(settings.selectedVoiceYourLang);
        setVoiceYourLangManuallySelected(true);
      }
      if (settings.selectedVoiceTip !== undefined) {
        setSelectedVoiceTip(settings.selectedVoiceTip);
        setVoiceTipManuallySelected(true);
      }
    }
  }, [selectedLanguage]);

  // Сохранение настроек
  useEffect(() => {
    const settings = {
      selectedLanguage,
      readingSpeed,
      repeatCount,
      recordsToPlay,
      selectedVoice,
      selectedVoiceYourLang,
      delayBetweenRecords,
      tipLanguage,
      selectedVoiceTip,
    };

    localStorage.setItem('playerSettings', JSON.stringify(settings));

    // Передаем настройки в родительский компонент
    if (onPlayerSettingsChange) {
      onPlayerSettingsChange({
        repeatCount,
        readingSpeed,
        selectedVoice,
        selectedVoiceYourLang,
        tipLanguage,
        selectedVoiceTip,
        delayBetweenRecords,
        availableVoices,
      });
    }
  }, [selectedLanguage, readingSpeed, repeatCount, recordsToPlay, selectedVoice, selectedVoiceYourLang, delayBetweenRecords, tipLanguage, selectedVoiceTip, availableVoices, onPlayerSettingsChange]);

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
    setVoiceManuallySelected(true); // Отмечаем, что голос был выбран вручную
  };

  const handleVoiceYourLangChange = (e) => {
    setSelectedVoiceYourLang(e.target.value);
    setVoiceYourLangManuallySelected(true); // Отмечаем, что голос был выбран вручную
  };

  const handleTipLanguageChange = (value) => {
    setTipLanguage(value);
    // При смене языка подсказки сбрасываем флаг ручного выбора голоса для этого языка
    setVoiceTipManuallySelected(false);
  };

  const handleVoiceTipChange = (e) => {
    setSelectedVoiceTip(e.target.value);
    setVoiceTipManuallySelected(true); // Отмечаем, что голос был выбран вручную
  };

  // Обработчики изменения основных языков
  const handleTTSLanguageChangeWrapper = (value) => {
    onTTSLanguageChange(value);
    // При смене изучаемого языка сбрасываем флаг ручного выбора голоса
    setVoiceManuallySelected(false);
  };

  const handleSelectedLanguageChangeWrapper = (value) => {
    onSelectedLanguageChange(value);
    // При смене вашего языка сбрасываем флаг ручного выбора голоса
    setVoiceYourLangManuallySelected(false);
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
            onChange={(e) => handleSelectedLanguageChangeWrapper(e.target.value)}
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
            onChange={(e) => handleTTSLanguageChangeWrapper(e.target.value)}
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
      <PlayerProvider
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
      >
        <PlayerControls />
        <PreventScreenSleep />
      </PlayerProvider>

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