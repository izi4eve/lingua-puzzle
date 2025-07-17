import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { IoTrashOutline } from "react-icons/io5";

const EditEntryModal = ({ 
  show, 
  onHide, 
  entry, 
  onSave, 
  onDelete,
  showDeleteButton = true 
}) => {
  const { t } = useTranslation();
  
  const [editableEntry, setEditableEntry] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (entry && show) {
      // Формируем строку для редактирования по логике FileUploader
      let entryString = `${entry.foreignPart} = ${entry.translation}`;
      
      if (entry.tipPart && entry.tipPart.trim() !== '') {
        entryString += ` = ${entry.tipPart}`;
      }
      
      if (entry.isLearned) {
        entryString += ' =';
      }
      
      setEditableEntry(entryString);
      setErrorMessage('');
    }
  }, [entry, show]);

  const handleTextareaChange = (e) => {
    const input = e.target.value;
    setEditableEntry(input);
    
    // Валидация: должно быть от 1 до 3 знаков равенства
    const lines = input.split('\n');
    let hasError = false;

    for (const line of lines) {
      if (line.trim().length === 0) continue;
      const equalitySigns = (line.match(/=/g) || []).length;
      if (equalitySigns < 1 || equalitySigns > 3) {
        hasError = true;
        break;
      }
    }

    if (hasError) {
      setErrorMessage(t('equal-sign-error'));
    } else {
      setErrorMessage('');
    }
  };

  const parseEntry = (entryString) => {
    const trimmedLine = entryString.trim();
    const parts = trimmedLine.split('=');
    
    if (parts.length < 2 || parts.length > 4) {
      return null;
    }

    const foreignPart = parts[0].trim();
    const translation = parts[1].trim();
    
    let tipPart = '';
    let isLearned = false;

    if (parts.length >= 3) {
      const thirdPart = parts[2].trim();
      
      if (parts.length === 3) {
        // Если третья часть пустая, то это learned
        if (thirdPart === '') {
          isLearned = true;
        } else {
          // Если третья часть не пустая, то это tipPart
          tipPart = thirdPart;
        }
      } else if (parts.length === 4) {
        // Если есть четвертая часть
        tipPart = thirdPart;
        const fourthPart = parts[3].trim();
        if (fourthPart === '') {
          isLearned = true;
        }
      }
    }

    return {
      foreignPart: foreignPart || '',
      translation: translation || '',
      tipPart: tipPart || '',
      isLearned
    };
  };

  const handleSave = () => {
    if (errorMessage || !editableEntry.trim()) return;

    const parsedEntry = parseEntry(editableEntry);
    if (!parsedEntry || !parsedEntry.foreignPart || !parsedEntry.translation) {
      setErrorMessage(t('equal-sign-error'));
      return;
    }

    onSave(parsedEntry);
    handleClose();
  };

  const handleDelete = () => {
    onDelete();
    handleClose();
  };

  const handleClose = () => {
    setEditableEntry('');
    setErrorMessage('');
    onHide();
  };

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{t('editing-entry')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {errorMessage && (
          <Alert variant="danger" className="p-2">
            {errorMessage}
          </Alert>
        )}
        <Form.Control
          as="textarea"
          rows={3}
          value={editableEntry}
          onChange={handleTextareaChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          placeholder="word = translation = tip ="
        />
        <div className="mt-2 text-muted small">
          {t('add-entries-instruction')}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="d-flex justify-content-between w-100">
          {showDeleteButton && (
            <Button variant="link" className="text-black p-0 ps-1" onClick={handleDelete}>
              <IoTrashOutline
                size={20}
                className="mb-1"
                style={{ cursor: 'pointer' }}
              />
            </Button>
          )}
          
          <div className="d-flex gap-2">
            <Button variant="outline-dark btn-sm rounded-2" onClick={handleClose}>
              {t('cancel')}
            </Button>
            <Button 
              variant="dark btn-sm rounded-2" 
              onClick={handleSave}
              disabled={!!errorMessage}
            >
              {t('save')}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default EditEntryModal;