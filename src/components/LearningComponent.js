import React, { useState, useEffect, useRef } from 'react';
import Title from './Title';
import { TbCircleNumber2Filled } from "react-icons/tb";
import { IoTrashBin } from 'react-icons/io5';

const LearningComponent = ({ data, firstElement, count, updateData }) => {
    // Состояние для хранения всех частей splitForeignPart
    const [allParts, setAllParts] = useState([]);
    const collectedPartsRef = useRef([]); // Временное хранилище без ререндера

    // Фильтруем элементы, где isLearned === false
    const unlearnedData = data
        .map((item, index) => ({ ...item, originalIndex: index })) // Добавляем оригинальный индекс
        .filter(item => !item.isLearned); // Фильтруем по isLearned

    // Функция для получения нужных элементов с учётом firstElement и count
    const getElementsToDisplay = () => {
        let elementsToDisplay = [];

        // Проверяем, сколько элементов от firstElement можно отобразить
        for (let i = 0; i < Math.min(count, unlearnedData.length); i++) {
            const index = (firstElement + i) % unlearnedData.length;
            elementsToDisplay.push(unlearnedData[index]);
        }

        return elementsToDisplay;
    };

    const elementsToDisplay = getElementsToDisplay();

    // Обновляем allParts при изменении elementsToDisplay
    useEffect(() => {
        const collectedParts = [];

        elementsToDisplay.forEach(item => {
            const splitForeignPart = item.foreignPart.split(/(?=\s[a-zA-Z0-9])/);
            collectedParts.push(...splitForeignPart); // Добавляем части в массив
        });

        // Используем ref для временного хранения и обновляем состояние, если массив изменился
        if (JSON.stringify(collectedPartsRef.current) !== JSON.stringify(collectedParts)) {
            collectedPartsRef.current = collectedParts; // Обновляем ref
            setAllParts([...collectedParts].sort()); // Обновляем состояние, если данные изменились
        }
    }, [elementsToDisplay]); // Теперь зависимость только от elementsToDisplay

    // Функция для отметки элемента как выученного
    const handleLearned = (originalIndex) => {
        const updatedData = data.map((item, i) =>
            i === originalIndex ? { ...item, isLearned: true } : item
        );
        updateData(updatedData);  // Передаём обновлённый массив в родительский компонент
    };

    // Если все элементы изучены, выводим сообщение
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
                    {elementsToDisplay.map((item, index) => {
                        // Разбиваем foreignPart на части
                        const splitForeignPart = item.foreignPart.split(/(?=\s[a-zA-Z0-9])/);
                        console.log(splitForeignPart);

                        return (
                            <tr key={index} className="element-box">
                                <td className="c-delete">
                                    <IoTrashBin
                                        size={23}
                                        onClick={() => handleLearned(item.originalIndex)} // Используем originalIndex
                                        className="light-grey"
                                        style={{ cursor: 'pointer' }} />
                                </td>
                                <td className="c-translate">{item.translation}</td>
                                <td className="c-equal text-center"> = </td>
                                <td className="c-foreign">
                                    <div className="d-flex flex-wrap gap-2 justify-content-start">
                                        {splitForeignPart.map((part, subIndex) => (
                                            <div
                                                key={subIndex} // Уникальный ключ для каждого подэлемента
                                                className="nowrap btn btn-light rounded-pill color-transparent"
                                                data-value={part} // Скрытое значение элемента
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

            {/* Выводим отсортированные элементы после таблицы */}
            <div className="d-flex flex-wrap gap-2 justify-content-start">
                {allParts.map((part, index) => (
                    <div
                        key={index}
                        className="nowrap btn btn-light rounded-pill"
                        data-value={part}
                    >
                        {part}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LearningComponent;