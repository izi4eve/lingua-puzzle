import React from 'react';
import Title from './Title';
import { TbCircleNumber2Filled } from "react-icons/tb";
import { IoTrashBin } from 'react-icons/io5';

const LearningComponent = ({ data, firstElement, count, updateData }) => {
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

    // Функция для отметки элемента как выученного
    const handleLearned = (originalIndex) => {
        const updatedData = data.map((item, i) =>
            i === originalIndex ? { ...item, isLearned: true } : item
        );
        updateData(updatedData);  // Передаём обновлённый массив в родительский компонент
    };

    // Если все элементы изучены
    if (unlearnedData.length === 0) {
        return (
            <div className="bg-warning-subtle rounded-4 p-3 my-3">
                All elements learned! Choose new or this dictionary.
            </div>
        );
    }

    const elementsToDisplay = getElementsToDisplay();

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<TbCircleNumber2Filled size={28} />} text="Place the pieces below in the correct places" />

            <table className="table fw-bold">
                <tbody>
                    {elementsToDisplay.map((item, index) => (
                        <tr key={index} className="element-box">
                            <td className="c-delete">
                                <IoTrashBin
                                    size={23}
                                    onClick={() => handleLearned(item.originalIndex)}  // Используем originalIndex
                                    className="light-grey"
                                    style={{ cursor: 'pointer' }}
                                />
                            </td>
                            <td className="c-translate">{item.translation}</td>
                            <td className="c-equal text-center"> = </td>
                            <td className="c-foreign">{item.foreignPart}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default LearningComponent;