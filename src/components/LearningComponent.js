import React, { useState, useEffect, useRef } from 'react';
import Title from './Title';
import { TbCircleNumber2Filled } from "react-icons/tb";
import { IoTrashBin } from 'react-icons/io5';

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

            <table className="table fw-bold">
                <tbody>
                    {elementsToDisplay.map((item, rowIndex) => {
                        const splitForeignPart = item.foreignPart.split(/(?=\s[a-zA-Z0-9])/);

                        return (
                            <tr key={rowIndex} className="element-box">
                                <td className="c-delete">
                                    <IoTrashBin
                                        size={23}
                                        onClick={() => handleLearned(item.originalIndex)}
                                        className="light-grey"
                                        style={{ cursor: 'pointer' }} />
                                </td>
                                <td className="c-translate">{item.translation}</td>
                                <td className="c-equal text-center"> = </td>
                                <td className="c-foreign">
                                    <div className="d-flex flex-wrap gap-2 justify-content-start">
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
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            <div className="d-flex flex-wrap gap-2 justify-content-start">
                {allParts.length === 0 ? (
                    <p>Congratulations, you've matched all. Move next.</p>
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