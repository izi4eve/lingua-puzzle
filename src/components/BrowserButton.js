import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FaArrowRight } from 'react-icons/fa';

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

const BrowserButton = ({ link, buttonText, variant = 'primary', mode = 'button' }) => {
  const [showModal, setShowModal] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [inputUrl, setInputUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState(null);

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
        <Modal.Body className="p-0 position-relative">
          <div className="position-relative w-100 h-100">
            {iframeError ? (
              <div
                className="d-flex align-items-center justify-content-center w-100 h-100 bg-light"
                style={{ minHeight: '100vh' }}
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
          <button
            className="close-button"
            onClick={handleClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default BrowserButton;