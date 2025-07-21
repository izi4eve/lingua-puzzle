import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FaArrowRight } from 'react-icons/fa';

// Импортируем компоненты плеера
import PlayerControls from './PlayerControls';
import { PlayerProvider } from './PlayerContext';
import PreventScreenSleep from './PreventScreenSleep';

// Функция для анализа ссылки и формирования embed (YouTube или обычная ссылка)
const getEmbedUrl = (url) => {
  try {
    const parsedUrl = new URL(url);

    // Проверяем, является ли это YouTube
    const isYouTube =
      parsedUrl.hostname.includes('youtube.com') ||
      parsedUrl.hostname.includes('youtu.be');
    if (isYouTube) {
      // Проверяем, является ли это плейлистом
      const playlistId = parsedUrl.searchParams.get('list');
      if (playlistId) {
        return `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
      }

      // Проверяем, является ли это видео
      let videoId;
      if (parsedUrl.pathname.includes('watch')) {
        videoId = parsedUrl.searchParams.get('v');
      } else if (parsedUrl.hostname.includes('youtu.be')) {
        videoId = parsedUrl.pathname.split('/').pop().split('?')[0]; // Убираем ?si=...
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }

      return null; // Некорректная YouTube-ссылка
    }

    // Для всех остальных ссылок возвращаем как есть
    return url;
  } catch {
    return null; // Если URL некорректен
  }
};

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
};

const BrowserButton = ({
  link,
  buttonText,
  variant = 'primary',
  mode = 'button',
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

  // Добавить все состояния
  const [repeatCount, setRepeatCount] = useState(3);
  const [readingSpeed, setReadingSpeed] = useState(0.5);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [selectedVoiceYourLang, setSelectedVoiceYourLang] = useState(null);
  const [tipLanguage, setTipLanguage] = useState(selectedLanguage);
  const [selectedVoiceTip, setSelectedVoiceTip] = useState(null);
  const [delayBetweenRecords, setDelayBetweenRecords] = useState(2);
  const [recordsToPlay, setRecordsToPlay] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState(null);

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
  }, [ttsLanguage, selectedLanguage, tipLanguage, languages]); // Убрал voicePriority из зависимостей

  // Проверка поддержки Web Speech API
  useEffect(() => {
    if (!window.speechSynthesis) {
      alert(t('speech-synthesis-not-supported'));
    }
  }, [t]);

  // Загрузка сохранённых настроек
  useEffect(() => {
    const savedSettings = localStorage.getItem('browserButtonSettings'); // Изменил ключ
    if (savedSettings) {
      const { readingSpeed: savedReadingSpeed, repeatCount: savedRepeatCount, recordsToPlay: savedRecordsToPlay, selectedVoice: savedSelectedVoice, selectedVoiceYourLang: savedSelectedVoiceYourLang, delayBetweenRecords: savedDelayBetweenRecords, tipLanguage: savedTipLanguage, selectedVoiceTip: savedSelectedVoiceTip } = JSON.parse(savedSettings);
      setReadingSpeed(savedReadingSpeed ?? 0.75);
      setRepeatCount(savedRepeatCount ?? 3);
      setRecordsToPlay(savedRecordsToPlay ?? 'all');
      setSelectedVoice(savedSelectedVoice ?? null);
      setSelectedVoiceYourLang(savedSelectedVoiceYourLang ?? null);
      setDelayBetweenRecords(savedDelayBetweenRecords ?? 2);
      setTipLanguage(savedTipLanguage ?? selectedLanguage);
      setSelectedVoiceTip(savedSelectedVoiceTip ?? null);
    }
  }, [selectedLanguage]);

  // Сохранение настроек
  useEffect(() => {
    localStorage.setItem('browserButtonSettings', JSON.stringify({ // Изменил ключ
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

  const handleClose = () => {
    setShowModal(false);
    setIframeError(false);
    setInputUrl('');
    setEmbedUrl(null);
  };

  const handleShow = () => {
    if (mode === 'input' && inputUrl) {
      const embed = getEmbedUrl(inputUrl);
      if (embed) {
        setEmbedUrl(embed);
        setShowModal(true);
      } else {
        alert('Please, enter a valid URL (YouTube video, playlist, or web link).');
      }
    } else {
      setShowModal(true);
    }
  };

  const handleInputChange = (e) => {
    setInputUrl(e.target.value);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleShow();
    }
  };

  return (
    <>
      {mode === 'button' ? (
        <Button
          variant={variant}
          size="sm"
          onClick={handleShow}
          className="rounded-pill me-1 mb-1 px-3"
        >
          {buttonText}
        </Button>
      ) : (
        <Form.Group className="d-flex align-items-center mb-1 me-1">
          <Form.Control
            type="text"
            placeholder="Youtube or web link"
            value={inputUrl}
            onChange={handleInputChange}
            onKeyUp={handleKeyPress}
            className="me-2 rounded-pill"
            style={{ maxWidth: '250px' }}
          />
          <Button
            variant={variant}
            size="sm"
            onClick={handleShow}
            className="rounded-pill px-3"
          >
            <FaArrowRight />
          </Button>
        </Form.Group>
      )}

      <Modal
        show={showModal}
        onHide={handleClose}
        fullscreen={true}
        dialogClassName="m-0"
        contentClassName="p-0"
      >
        <Modal.Body className="p-0 position-relative d-flex flex-column">
          {/* Контейнер для iframe - занимает всё доступное место минус 80px */}
          <div className="position-relative flex-grow-1" style={{ height: 'calc(100vh - 80px)' }}>
            {iframeError ? (
              <div
                className="d-flex align-items-center justify-content-center w-100 h-100 bg-light"
              >
                <p className="text-danger text-center">
                  It's not possible to open this website. Open other!
                </p>
              </div>
            ) : (
              <iframe
                src={mode === 'input' ? embedUrl : link}
                title="Browser content"
                style={{ width: '100%', height: '100%', border: 'none' }}
                onError={() => setIframeError(true)}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
            <div className="overlay-content" style={{ position: 'absolute', top: 0, left: 0 }} />
          </div>

          {/* Контейнер для PlayerControls - фиксированная высота 80px */}
          <div
            className="bg-white border-top p-2 align-items-center"
            style={{ height: '120px', minHeight: '120px' }}
          >
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
          </div>

          <button
            className="close-button"
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(0,0,0,0.5)',
              color: 'white',
              border: 'none',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              fontSize: '24px',
              cursor: 'pointer',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default BrowserButton;