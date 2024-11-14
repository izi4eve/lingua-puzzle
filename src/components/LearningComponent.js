import React, { useState, useEffect, useRef } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import Title from './Title';
import TextToSpeech from './TextToSpeech';
import { TbCircleNumber2Filled } from "react-icons/tb";
import { IoMdClose } from 'react-icons/io';
import { Toast, ToastContainer, Modal, Button, Form } from 'react-bootstrap';

const WORD_SPLIT_REGEX = /(?=\s[\p{L}\p{N}])/u;

const LearningComponent = ({ data, firstElement, count, updateData, language }) => {
    const { t } = useTranslation();

    const [allParts, setAllParts] = useState([]);
    const collectedPartsRef = useRef([]);
    const [selectedPart, setSelectedPart] = useState({ value: null, rowIndex: null, partIndex: null });
    const [highlightedOriginIndex, setHighlightedOriginIndex] = useState(null);
    const [matchedSpots, setMatchedSpots] = useState([]);
    const [showWarning, setShowWarning] = useState(false); // Новое состояние для показа предупреждения

    const [showEditModal, setShowEditModal] = useState(false);
    const [editableTranslation, setEditableTranslation] = useState('');
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

    const handleOpenEditModal = (foreignPart, translation, rowIndex) => {
        setEditableTranslation(`${foreignPart} = ${translation}`);
        setEditRowIndex(rowIndex);
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditableTranslation('');
    };

    const handleSaveEdit = () => {
        // Разделяем строку на две части по знаку " = "
        const [foreignPart, translation] = editableTranslation.split('=');

        const updatedData = data.map((item, i) =>
            i === elementsToDisplay[editRowIndex].originalIndex
                ? { ...item, foreignPart: foreignPart.trim(), translation: translation.trim() }
                : item
        );

        updateData(updatedData);
        setShowEditModal(false);
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
            <Title icon={<TbCircleNumber2Filled size={28} />} text={t('assemble-parts')} />

            <div className="table-box fw-bold">
                {elementsToDisplay.map((item, rowIndex) => {
                    const splitForeignPart = item.foreignPart.split(WORD_SPLIT_REGEX);

                    return (
                        <div key={rowIndex} className="row-box d-flex pt-2 pb-2">
                            <div className="flex-grow-1 d-flex flex-wrap gap-2 justify-content-start  align-items-start">
                                <div className="pe-2">
                                    <TextToSpeech text={item.foreignPart} language={language} />
                                </div>
                                <div className="pt-2 c-translate">
                                    <button
                                        type="button"
                                        onClick={() => handleOpenEditModal(item.foreignPart, item.translation, rowIndex)}
                                        className="btn btn-link p-0 m-0"
                                    >
                                        {item.translation}
                                    </button>
                                </div>
                                <div className="pt-2 px-1 c-equal text-center">=</div>
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

            <Modal show={showEditModal} onHide={handleCloseEditModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Редактирование записи</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Control
                        as="textarea"
                        rows={3}
                        value={editableTranslation}
                        onChange={(e) => setEditableTranslation(e.target.value)}
                    />
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseEditModal}>Отмена</Button>
                    <Button variant="primary" onClick={handleSaveEdit}>Сохранить</Button>
                </Modal.Footer>
            </Modal>

        </div>
    );
};

export default LearningComponent;