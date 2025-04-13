// src/components/BrowserButton.js
import React, { useState } from 'react';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';

const BrowserButton = ({ link, buttonText, variant = 'primary' }) => {
  const [showModal, setShowModal] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  const handleClose = () => {
    setShowModal(false);
    setIframeError(false);
  };
  const handleShow = () => setShowModal(true);

  return (
    <>
      <Button variant={variant} size="sm" onClick={handleShow} className="rounded-pill me-1 mb-1 px-3">
        {buttonText}
      </Button>

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
                  Этот сайт запрещает его просмотр в сторонних приложениях. Откройте другой сайт.
                </p>
              </div>
            ) : (
              <iframe
                src={link}
                title="Browser content"
                style={{ width: '100%', height: '100%', border: 'none' }}
                onError={() => setIframeError(true)}
                loading="lazy"
                sandbox="allow-scripts allow-same-origin"
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