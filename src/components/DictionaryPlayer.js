import React, { useEffect, useState, useCallback } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowRight } from 'react-icons/fa';
import { TbCircleNumber2Filled } from 'react-icons/tb';

import PlayerControls from './PlayerControls';
import { PlayerProvider } from './PlayerContext';
import Title from './Title';
import PreventScreenSleep from './PreventScreenSleep';

// Приоритетные голоса для каждого языка
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
  'uk-UA': ['Lesya'],
  'tr-TR': ['Yelda'],
};

const DictionaryPlayer = ({
  data,
  firstElement,
  updateFirstElement,
  foreignLanguage,
  translationLanguage,
  tipLanguage,
  onForeignLanguageChange,
  onTranslationLanguageChange,
  onTipLanguageChange,
  supportedContentLanguages,
  ttsLanguages, // Переименуем в speechSynthesisLanguages в будущем
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
  const [delayBetweenRecords, setDelayBetweenRecords] = useState(2);

  // Голоса для каждого языка
  const [selectedVoiceForeign, setSelectedVoiceForeign] = useState(null);
  const [selectedVoiceTranslation, setSelectedVoiceTranslation] = useState(null);
  const [selectedVoiceTip, setSelectedVoiceTip] = useState(null);

  // Флаги для отслеживания того, были ли голоса выбраны пользователем вручную
  const [voiceForeignManuallySelected, setVoiceForeignManuallySelected] = useState(false);
  const [voiceTranslationManuallySelected, setVoiceTranslationManuallySelected] = useState(false);
  const [voiceTipManuallySelected, setVoiceTipManuallySelected] = useState(false);

  const filteredData = data.filter((item) => !item.isLearned);
  const maxIndex = Math.max(0, filteredData.length - 1);

  // Функция для получения TTS кода языка - используем useCallback для стабильности
  const getTTSLanguageCode = useCallback((langCode) => {
    const ttsLang = ttsLanguages.find(lang => lang.code.startsWith(langCode));
    return ttsLang ? ttsLang.code : `${langCode}-${langCode.toUpperCase()}`;
  }, [ttsLanguages]);

  // Функция для поиска лучшего голоса - используем useCallback для стабильности
  const findBestVoice = useCallback((langCode, voices) => {
    const ttsCode = getTTSLanguageCode(langCode);
    const priorityVoices = voicePriority[ttsCode] || [];

    return voices.find(v => priorityVoices.includes(v.name) && v.lang.startsWith(langCode)) ||
      voices.find(v => v.lang.startsWith(langCode) && !v.default) ||
      voices.find(v => v.lang.startsWith(langCode)) ||
      voices.find(v => v.default);
  }, [getTTSLanguageCode]);

  // Загрузка доступных голосов
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Автоматический выбор голосов только если они не были выбраны пользователем вручную

      // Для изучаемого языка (foreignPart)
      if (!voiceForeignManuallySelected) {
        const bestVoice = findBestVoice(foreignLanguage, voices);
        setSelectedVoiceForeign(bestVoice ? bestVoice.name : null);
      }

      // Для языка переводов (translation)
      if (!voiceTranslationManuallySelected) {
        const bestVoice = findBestVoice(translationLanguage, voices);
        setSelectedVoiceTranslation(bestVoice ? bestVoice.name : null);
      }

      // Для языка подсказок (tipPart)
      if (!voiceTipManuallySelected) {
        const bestVoice = findBestVoice(tipLanguage, voices);
        setSelectedVoiceTip(bestVoice ? bestVoice.name : null);
      }
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [foreignLanguage, translationLanguage, tipLanguage, voiceForeignManuallySelected,
    voiceTranslationManuallySelected, voiceTipManuallySelected, findBestVoice]);

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
      setReadingSpeed(settings.readingSpeed ?? 0.5);
      setRepeatCount(settings.repeatCount ?? 3);
      setRecordsToPlay(settings.recordsToPlay ?? 'all');
      setDelayBetweenRecords(settings.delayBetweenRecords ?? 2);

      // Если голоса были сохранены, значит они были выбраны пользователем
      if (settings.selectedVoiceForeign !== undefined) {
        setSelectedVoiceForeign(settings.selectedVoiceForeign);
        setVoiceForeignManuallySelected(true);
      }
      if (settings.selectedVoiceTranslation !== undefined) {
        setSelectedVoiceTranslation(settings.selectedVoiceTranslation);
        setVoiceTranslationManuallySelected(true);
      }
      if (settings.selectedVoiceTip !== undefined) {
        setSelectedVoiceTip(settings.selectedVoiceTip);
        setVoiceTipManuallySelected(true);
      }
    }
  }, []);

  // Сохранение настроек
  useEffect(() => {
    const settings = {
      foreignLanguage,
      translationLanguage,
      tipLanguage,
      readingSpeed,
      repeatCount,
      recordsToPlay,
      selectedVoiceForeign,
      selectedVoiceTranslation,
      selectedVoiceTip,
      delayBetweenRecords,
    };

    localStorage.setItem('playerSettings', JSON.stringify(settings));

    // Передаем настройки в родительский компонент (для обратной совместимости)
    if (onPlayerSettingsChange) {
      onPlayerSettingsChange({
        repeatCount,
        readingSpeed,
        selectedVoice: selectedVoiceForeign, // для обратной совместимости
        selectedVoiceYourLang: selectedVoiceTranslation, // для обратной совместимости
        tipLanguage,
        selectedVoiceTip,
        delayBetweenRecords,
        availableVoices,
      });
    }
  }, [foreignLanguage, translationLanguage, tipLanguage, readingSpeed, repeatCount, recordsToPlay,
    selectedVoiceForeign, selectedVoiceTranslation, selectedVoiceTip, delayBetweenRecords,
    availableVoices, onPlayerSettingsChange]);

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

  // Обработчики изменения голосов
  const handleVoiceForeignChange = (e) => {
    setSelectedVoiceForeign(e.target.value);
    setVoiceForeignManuallySelected(true);
  };

  const handleVoiceTranslationChange = (e) => {
    setSelectedVoiceTranslation(e.target.value);
    setVoiceTranslationManuallySelected(true);
  };

  const handleVoiceTipChange = (e) => {
    setSelectedVoiceTip(e.target.value);
    setVoiceTipManuallySelected(true);
  };

  // Обработчики изменения языков контента
  const handleForeignLanguageChangeWrapper = (value) => {
    onForeignLanguageChange(value);
    setVoiceForeignManuallySelected(false); // Сбрасываем флаг при смене языка
  };

  const handleTranslationLanguageChangeWrapper = (value) => {
    onTranslationLanguageChange(value);
    setVoiceTranslationManuallySelected(false); // Сбрасываем флаг при смене языка
  };

  const handleTipLanguageChangeWrapper = (value) => {
    onTipLanguageChange(value);
    setVoiceTipManuallySelected(false); // Сбрасываем флаг при смене языка
  };

  return (
    <div className="whiteBox rounded-4 p-3 my-3">
      <PreventScreenSleep />
      <Title icon={<TbCircleNumber2Filled size={28} />} text={t('listen-dictionary')} />

      <div className="d-flex flex-row flex-wrap column-gap-2 row-gap-1 mt-1">

        {/* НАСТРОЙКИ ЯЗЫКА ПЕРЕВОДОВ (translation) */}
        <div className="d-flex align-items-center">
          <label>{t('translation-language')}</label>
          <Form.Select
            value={translationLanguage}
            onChange={(e) => handleTranslationLanguageChangeWrapper(e.target.value)}
            className="ms-2 w-auto"
          >
            {supportedContentLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('voice')}</label>
          <Form.Select
            value={selectedVoiceTranslation || ''}
            onChange={handleVoiceTranslationChange}
            className="ms-2 w-auto"
          >
            <option value="">{t('default-voice')}</option>
            {availableVoices
              .filter((voice) => voice.lang.startsWith(translationLanguage))
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.default ? `(${t('default')})` : ''}
                </option>
              ))}
          </Form.Select>
        </div>

        <div className="w-100"></div>

        {/* НАСТРОЙКИ ИЗУЧАЕМОГО ЯЗЫКА (foreignPart) */}
        <div className="d-flex align-items-center">
          <label>{t('foreign-language')}</label>
          <Form.Select
            value={foreignLanguage}
            onChange={(e) => handleForeignLanguageChangeWrapper(e.target.value)}
            className="ms-2 w-auto"
          >
            {supportedContentLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </Form.Select>
        </div>

        <div className="d-flex align-items-center">
          <label>{t('voice')}</label>
          <Form.Select
            value={selectedVoiceForeign || ''}
            onChange={handleVoiceForeignChange}
            className="ms-2 w-auto"
          >
            <option value="">{t('default-voice')}</option>
            {availableVoices
              .filter((voice) => voice.lang.startsWith(foreignLanguage))
              .map((voice) => (
                <option key={voice.name} value={voice.name}>
                  {voice.name} {voice.default ? `(${t('default')})` : ''}
                </option>
              ))}
          </Form.Select>
        </div>

        <div className="w-100"></div>

        {/* НАСТРОЙКИ ЯЗЫКА ПОДСКАЗОК (tipPart) */}
        <div className="d-flex align-items-center">
          <label>{t('tip-language')}</label>
          <Form.Select
            value={tipLanguage}
            onChange={(e) => handleTipLanguageChangeWrapper(e.target.value)}
            className="ms-2 w-auto"
          >
            {supportedContentLanguages.map((lang) => (
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

        {/* ОБЩИЕ НАСТРОЙКИ ВОСПРОИЗВЕДЕНИЯ */}
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
        foreignLanguage={foreignLanguage}
        translationLanguage={translationLanguage}
        tipLanguage={tipLanguage}
        ttsLanguages={ttsLanguages}
        onMarkAsLearned={onMarkAsLearned}
        onEditEntry={onEditEntry}
        onDeleteEntry={onDeleteEntry}
        readingSpeed={readingSpeed}
        repeatCount={repeatCount}
        selectedVoiceForeign={selectedVoiceForeign}
        selectedVoiceTranslation={selectedVoiceTranslation}
        selectedVoiceTip={selectedVoiceTip}
        delayBetweenRecords={delayBetweenRecords}
        availableVoices={availableVoices}
      >
        <PlayerControls />
      </PlayerProvider>

      <div className="mt-3">
        {filteredData.length > 0 && (
          <div>
            <div className="d-flex gap-3">
              <div>{t('record')}: <span className="fw-bold">{currentRecord + 1}/{maxIndex + 1}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DictionaryPlayer;