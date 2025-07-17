import React, { useState, useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Title from './Title';
import TextToSpeech from './TextToSpeech';
import EditEntryModal from './EditEntryModal';
import { TbCircleNumber3Filled } from "react-icons/tb";
import { IoMdClose } from 'react-icons/io';
import { Toast, ToastContainer } from 'react-bootstrap';

const WORD_SPLIT_REGEX = /(?=\s[\p{L}\p{N}])/u;

const LearningComponent = ({ data, firstElement, count, updateData, language, setFirstElement }) => {
  const { t } = useTranslation();

  const [allParts, setAllParts] = useState([]);
  const collectedPartsRef = useRef([]);
  const [selectedPart, setSelectedPart] = useState({ value: null, rowIndex: null, partIndex: null });
  const [highlightedOriginIndex, setHighlightedOriginIndex] = useState(null);
  const [matchedSpots, setMatchedSpots] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editRowIndex, setEditRowIndex] = useState(null);

  const unlearnedData = data
    .map((item, index) => ({ ...item, originalIndex: index }))
    .filter(item => !item.isLearned);

  const getElementsToDisplay = () => {
    let elementsToDisplay = [];
    for (let i = 0; i < Math.min(count, unlearnedData.length); i++) {
      const index = (firstElement + i) % unlearnedData.length;
      elementsToDisplay.push(unlearnedData[index]);
    }
    return elementsToDisplay;
  };

  const elementsToDisplay = getElementsToDisplay();

  useEffect(() => {
    const collectedParts = [];
    elementsToDisplay.forEach(item => {
      const splitForeignPart = item.foreignPart.split(WORD_SPLIT_REGEX);
      collectedParts.push(...splitForeignPart);
    });

    if (JSON.stringify(collectedPartsRef.current) !== JSON.stringify(collectedParts)) {
      collectedPartsRef.current = collectedParts;
      setAllParts([...collectedParts].sort());
      setMatchedSpots([]);
    }
  }, [elementsToDisplay]);

  const handleLearned = (originalIndex) => {
    const updatedData = data.map((item, i) =>
      i === originalIndex ? { ...item, isLearned: true } : item
    );
    updateData(updatedData);

    // Корректируем firstElement
    const newUnlearnedData = updatedData.filter(item => !item.isLearned);
    const newMaxUnlearnedIndex = Math.max(0, newUnlearnedData.length - count);
    if (firstElement > newMaxUnlearnedIndex) {
      setFirstElement(newMaxUnlearnedIndex);
    }
  };

  const handleSpotClick = (part, rowIndex, partIndex) => {
    setSelectedPart({ value: part, rowIndex, partIndex });
  };

  const handleOriginClick = (part, index) => {
    if (!selectedPart.value) {
      setShowWarning(true);
      setTimeout(() => setShowWarning(false), 3000);
      return;
    }

    if (selectedPart.value === part) {
      const partIndex = allParts.findIndex((p, idx) => p === part && idx === index);
      if (partIndex !== -1) {
        setMatchedSpots(prev => [...prev, `${selectedPart.rowIndex}-${selectedPart.partIndex}`]);
        setAllParts(prevParts => {
          const newParts = [...prevParts];
          newParts.splice(partIndex, 1);
          return newParts;
        });
        setSelectedPart({ value: null, rowIndex: null, partIndex: null });
      }
    } else {
      setHighlightedOriginIndex(index);
      setTimeout(() => setHighlightedOriginIndex(null), 2000);
    }
  };

  const handleOpenEditModal = (item, rowIndex) => {
    setEditingEntry(item);
    setEditRowIndex(rowIndex);
    setShowEditModal(true);
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingEntry(null);
    setEditRowIndex(null);
  };

  const handleSaveEdit = (updatedEntry) => {
    if (editRowIndex === null) return;

    const updatedData = data.map((item, i) =>
      i === elementsToDisplay[editRowIndex].originalIndex
        ? { 
            ...item, 
            foreignPart: updatedEntry.foreignPart,
            translation: updatedEntry.translation,
            tipPart: updatedEntry.tipPart,
            isLearned: updatedEntry.isLearned
          }
        : item
    );

    updateData(updatedData);

    // Корректируем firstElement
    const newUnlearnedData = updatedData.filter(item => !item.isLearned);
    const newMaxUnlearnedIndex = Math.max(0, newUnlearnedData.length - count);
    if (firstElement > newMaxUnlearnedIndex) {
      setFirstElement(newMaxUnlearnedIndex);
    }
  };

  const handleDeleteEntry = () => {
    if (editRowIndex === null) return;

    const updatedData = data.filter((_, i) => i !== elementsToDisplay[editRowIndex].originalIndex);

    updateData(updatedData);

    // Корректируем firstElement
    const newUnlearnedData = updatedData.filter(item => !item.isLearned);
    const newMaxUnlearnedIndex = Math.max(0, newUnlearnedData.length - count);
    if (firstElement > newMaxUnlearnedIndex) {
      setFirstElement(newMaxUnlearnedIndex);
    }
  };

  if (unlearnedData.length === 0) {
    return (
      <div className="bg-warning-subtle rounded-4 p-3 my-3">
        {t('all-learned')}
      </div>
    );
  }

  return (
    <div className="whiteBox rounded-4 p-3 my-3">
      <Title icon={<TbCircleNumber3Filled size={28} />} text={t('assemble-parts')} />

      <div className="table-box fw-bold">
        {elementsToDisplay.map((item, rowIndex) => {
          const splitForeignPart = item.foreignPart.split(WORD_SPLIT_REGEX);

          return (
            <div key={rowIndex} className="row-box d-flex pt-2 pb-2">
              <div className="flex-grow-1 d-flex flex-wrap gap-2 justify-content-start align-items-start">
                <div className="pe-2">
                  <TextToSpeech text={item.foreignPart} language={language} />
                </div>

                <div className="pt-1 c-translate">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(item, rowIndex)}
                    className="btn btn-link p-0 m-0"
                  >
                    {item.translation}
                  </button>
                </div>

                <div className="pt-1 px-1 c-equal text-center">=</div>

                {splitForeignPart.map((part, partIndex) => (
                  <div
                    key={partIndex}
                    className={`spot nowrap btn btn-light rounded-pill 
                      ${selectedPart.rowIndex === rowIndex && selectedPart.partIndex === partIndex ? 'bg-light-blue' : ''}
                      ${matchedSpots.includes(`${rowIndex}-${partIndex}`) ? 'matched' : ''}`}
                    data-value={part}
                    onClick={() => handleSpotClick(part, rowIndex, partIndex)}
                  >
                    {part}
                  </div>
                ))}
              </div>
              <div className="d-flex flex-column flex-md-row-reverse align-items-start ps-2">
                <div className="">
                  <IoMdClose
                    size={18}
                    onClick={() => handleLearned(item.originalIndex)}
                    className="light-grey"
                    style={{ cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="d-flex flex-wrap gap-2 justify-content-start pt-4 pb-2">
        {allParts.length === 0 ? (
          <div className="alert alert-warning mb-0 border-0 rounded-3" role="alert">
            <Trans i18nKey="all-matched">
              <strong>Congratulations!</strong> You've matched all. <strong>Delete</strong> the familiar and click <strong>Next</strong>
            </Trans>
          </div>
        ) : (
          allParts.map((part, index) => (
            <div
              key={index}
              className={`origin nowrap btn btn-light rounded-pill ${highlightedOriginIndex === index ? 'bg-light-red' : ''}`}
              data-value={part}
              onClick={() => handleOriginClick(part, index)}
            >
              {part}
            </div>
          ))
        )}
      </div>

      <ToastContainer
        className="position-fixed top-50 start-50 translate-middle p-3"
        style={{ maxWidth: '95%', width: '400px' }}
      >
        <Toast
          onClose={() => setShowWarning(false)}
          show={showWarning}
          delay={4000}
          autohide
          className="bg-info text-white border-0 rounded-3"
        >
          <Toast.Body>{t('select-spot-first')}</Toast.Body>
        </Toast>
      </ToastContainer>

      <EditEntryModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        entry={editingEntry}
        onSave={handleSaveEdit}
        onDelete={handleDeleteEntry}
        showDeleteButton={true}
      />
    </div>
  );
};

export default LearningComponent;