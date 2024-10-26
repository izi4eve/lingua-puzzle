import React, { useState, useEffect, useRef } from 'react';
import Title from './Title';
import { TbCircleNumber2Filled } from "react-icons/tb";
import { IoMdClose } from 'react-icons/io';

const LearningComponent = ({ data, firstElement, count, updateData }) => {
    const [allParts, setAllParts] = useState([]);
    const collectedPartsRef = useRef([]);
    const [selectedPart, setSelectedPart] = useState({ value: null, rowIndex: null, partIndex: null });
    const [highlightedOrigin, setHighlightedOrigin] = useState(null);
    const [matchedSpots, setMatchedSpots] = useState([]);

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
            const splitForeignPart = item.foreignPart.split(/(?=\s[a-zA-Z0-9])/);
            collectedParts.push(...splitForeignPart);
        });

        if (JSON.stringify(collectedPartsRef.current) !== JSON.stringify(collectedParts)) {
            collectedPartsRef.current = collectedParts;
            setAllParts([...collectedParts].sort());
            setMatchedSpots([]); // Обнуляем matchedSpots при загрузке новой порции данных
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

    const handleOriginClick = (part) => {
        if (selectedPart.value) {
            if (selectedPart.value === part) {
                // Находим индекс первого вхождения элемента в массиве allParts
                const partIndex = allParts.findIndex(p => p === part);
                if (partIndex !== -1) {
                    setMatchedSpots(prev => [...prev, `${selectedPart.rowIndex}-${selectedPart.partIndex}`]);
                    setAllParts(prevParts => {
                        const newParts = [...prevParts];
                        newParts.splice(partIndex, 1); // Удаляем только первое вхождение
                        return newParts;
                    });
                    setSelectedPart({ value: null, rowIndex: null, partIndex: null });
                }
            } else {
                setHighlightedOrigin(part);
                setTimeout(() => setHighlightedOrigin(null), 2000);
            }
        }
    };

    if (unlearnedData.length === 0) {
        return (
            <div className="bg-warning-subtle rounded-4 p-3 my-3">
                All elements learned! Choose new or this dictionary.
            </div>
        );
    }

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<TbCircleNumber2Filled size={28} />} text="Place the pieces below in the correct places" />

            <div className="table-box fw-bold">
                {elementsToDisplay.map((item, rowIndex) => {
                    const splitForeignPart = item.foreignPart.split(/(?=\s[a-zA-Z0-9])/);

                    return (
                        <div key={rowIndex} className="row-box d-flex py-2
                        border-bottom border-secondary border-secondary-subtle">
                            <div className="flex-grow-1 d-flex flex-wrap gap-2 justify-content-start">
                                <div className="py-2 c-translate">{item.translation}</div>
                                <div className="py-2 px-1 c-equal text-center">=</div>
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
                            <div className="">
                                <div className="c-delete">
                                    <IoMdClose
                                        size={18}
                                        onClick={() => handleLearned(item.originalIndex)}
                                        className="light-grey"
                                        style={{ cursor: 'pointer' }} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="d-flex flex-wrap gap-2 justify-content-start pt-4 pb-2">
                {allParts.length === 0 ? (
                    <div class="alert alert-warning border-0 rounded-3" role="alert">
                        <strong>Congratulations!</strong> You've matched all. <strong>Delete</strong> the familiar and click <strong>Next</strong>
                    </div>
                ) : (
                    allParts.map((part, index) => (
                        <div
                            key={index}
                            className={`origin nowrap btn btn-light rounded-pill ${highlightedOrigin === part ? 'bg-light-red' : ''}`}
                            data-value={part}
                            onClick={() => handleOriginClick(part)}
                        >
                            {part}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LearningComponent;