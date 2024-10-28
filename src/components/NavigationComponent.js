import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Form } from 'react-bootstrap';
import Title from './Title';
import { TbCircleNumber3Filled } from "react-icons/tb";

const NavigationComponent = ({ data, firstElement, setFirstElement, count }) => {
    const { t } = useTranslation();

    // Фильтруем элементы, где isLearned === true (выученные)
    const learnedData = data.filter(item => item.isLearned);

    // Рассчитываем границы для firstElement
    const maxUnlearnedIndex = Math.max(0, data.filter(item => !item.isLearned).length - count);

    // Введённое значение в поле
    const [inputValue, setInputValue] = useState(firstElement);

    // Обновляем поле ввода при изменении firstElement
    useEffect(() => {
        setInputValue(firstElement);
    }, [firstElement]);

    // Обработчик для кнопки "Назад"
    const handleBack = () => {
        setFirstElement(Math.max(0, firstElement - count));
    };

    // Обработчик для кнопки "Вперёд"
    const handleForward = () => {
        setFirstElement(Math.min(firstElement + count, maxUnlearnedIndex));
    };

    // Обработчик для изменения текста в поле ввода
    const handleInputChange = (e) => {
        const value = e.target.value;
        // Разрешаем только цифры
        if (/^\d*$/.test(value)) {
            setInputValue(Number(value));
        }
    };

    // Обработчик для кнопки "Перейти"
    const handleGo = () => {
        const adjustedValue = Math.max(0, Math.min(inputValue, maxUnlearnedIndex));
        setFirstElement(adjustedValue);
        setInputValue(adjustedValue);  // Сразу обновляем поле ввода корректным значением
    };

    // Обработчик для нажатия клавиши "Enter" в поле ввода
    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleGo();
        }
    };

    // Дополнительная информация
    const total = data.length;
    const learned = learnedData.length;
    const passed = learned + firstElement;
    const progress = total > 0 ? Math.round((passed / total) * 100) : 0;

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<TbCircleNumber3Filled size={28} />} text={t('navigate')} />
            <div className="d-flex my-1">
                <div className="btn-group me-3">
                    <Button onClick={handleBack} variant="outline-dark" disabled={firstElement === 0}>
                        {t('prev')}
                    </Button>

                    <Button onClick={handleForward} variant="outline-dark" disabled={firstElement >= maxUnlearnedIndex}>
                        {t('next')}
                    </Button>
                </div>

                <div className="btn-group">
                    <Form.Control
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyUp={handleKeyPress}  // Добавляем обработчик для клавиши Enter
                        className="rounded-start index-field"
                    />

                    <Button onClick={handleGo} variant="outline-dark" className="">
                        {/* {t('move')} */}
                        &#8594;
                    </Button>
                </div>

            </div>

            <div className="result d-flex mt-2 mb-1">
                <div>{t('total')}: <span>{total}</span></div>
                <div>{t('deleted')}: <span>{learned}</span></div>
                <div>{t('passed')}: <span>{passed}</span></div>
                <div>{t('progress')}: <span>{progress}%</span></div>
            </div>
        </div>
    );
};

export default NavigationComponent;