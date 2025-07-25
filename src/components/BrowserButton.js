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
  repeatCount = 3,
  readingSpeed = 0.5,
  selectedVoice = null,
  selectedVoiceYourLang = null,
  tipLanguage = selectedLanguage,
  selectedVoiceTip = null,
  delayBetweenRecords = 2,
  availableVoices = [],
}) => {
  const { t } = useTranslation();

  const [showModal, setShowModal] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState(null);

  // Проверка поддержки Web Speech API
  useEffect(() => {
    if (!window.speechSynthesis) {
      alert(t('speech-synthesis-not-supported'));
    }
  }, [t]);

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
        style={{
          // Заливка для области за пределами безопасной зоны
          background: '#000',
          // Используем dvh (dynamic viewport height) для корректной работы с iOS
          height: '100dvh',
          maxHeight: '100dvh'
        }}
      >
        <Modal.Body 
          className="p-0 position-relative d-flex flex-column"
          style={{
            // Основной контейнер занимает всю безопасную зону
            height: '100dvh',
            maxHeight: '100dvh',
            // Отступы для безопасных зон (notch, home indicator)
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
            background: '#ffc800'
          }}
        >
          {/* Контейнер для iframe - занимает всё доступное место минус высота PlayerControls */}
          <div 
            className="position-relative flex-grow-1" 
            style={{ 
              height: 'calc(100% - 120px)',
              minHeight: 0 // Важно для правильной работы flex
            }}
          >
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

          {/* Контейнер для PlayerControls - фиксированная высота 120px */}
          <div
            className="bg-white border-top p-2 align-items-center"
            style={{ 
              height: '120px', 
              minHeight: '120px',
              flexShrink: 0 // Предотвращает сжатие контейнера
            }}
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
              top: 'calc(env(safe-area-inset-top) + 10px)', // Отступ от безопасной зоны
              right: 'calc(env(safe-area-inset-right) + 10px)', // Отступ от безопасной зоны
              background: '#ffc800',
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