import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaPlay, FaPause, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import { Button, Form } from 'react-bootstrap';

const DictionaryPlayer = ({ data, firstElement, updateFirstElement, ttsLanguage }) => {
    const { t } = useTranslation();

    useEffect(() => {
        // Обновляем локальное состояние при изменении firstElement
        setCurrentRecord(firstElement);
    }, [firstElement]);

    // Состояния для управления
    const [currentRecord, setCurrentRecord] = useState(firstElement); // Нумерация от 0
    const [repeatCount, setRepeatCount] = useState(3);
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(ttsLanguage);
    const [readingSpeed, setReadingSpeed] = useState(0.5);
    const [inputValue, setInputValue] = useState(firstElement.toString());

    const filteredData = data.filter((item) => !item.isLearned); // Фильтруем записи
    const maxIndex = filteredData.length - 1;

    const currentRepeat = useRef(0); // Текущий повтор
    const speechSynthesisRef = useRef(null); // Ссылка на синтез речи

    // Сохранение параметров в localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('playerSettings');
        if (savedSettings) {
            const { selectedLanguage, readingSpeed, repeatCount } = JSON.parse(savedSettings);
            setSelectedLanguage(selectedLanguage);
            setReadingSpeed(readingSpeed);
            setRepeatCount(repeatCount);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('playerSettings', JSON.stringify({
            selectedLanguage,
            readingSpeed,
            repeatCount,
        }));
    }, [selectedLanguage, readingSpeed, repeatCount]);

    // Воспроизведение текущей записи
    useEffect(() => {
        // Синхронизация inputValue при изменении currentRecord
        setInputValue(currentRecord.toString());
    }, [currentRecord]);

    const playCurrentRecord = () => {
        if (currentRecord < 0 || currentRecord > maxIndex) return;

        const { foreignPart, translation } = filteredData[currentRecord];

        const utterTranslation = new SpeechSynthesisUtterance(translation);
        utterTranslation.lang = selectedLanguage;
        utterTranslation.rate = 1;

        const utterForeignPart = new SpeechSynthesisUtterance(foreignPart);
        utterForeignPart.lang = ttsLanguage;
        utterForeignPart.rate = readingSpeed;

        speechSynthesisRef.current = utterTranslation;

        utterTranslation.onend = () => {
            setTimeout(() => {
                speechSynthesisRef.current = utterForeignPart;
                window.speechSynthesis.speak(utterForeignPart);
            }, 500); // Пауза 0.5 сек
        };

        utterForeignPart.onend = () => {
            currentRepeat.current += 1; // Обновление счётчика повторов
            if (currentRepeat.current < repeatCount) {
                playCurrentRecord(); // Повтор записи
            } else {
                currentRepeat.current = 0; // Сброс счётчика повторов
                handleNext(); // Переход к следующей записи
            }
        };

        window.speechSynthesis.speak(utterTranslation);
    };

    // Автопроигрывание после изменения currentRecord
    useEffect(() => {
        if (isPlaying) {
            playCurrentRecord();
        }
    }, [currentRecord]);

    // Обработчики управления
    const handlePlayPause = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel();
            setIsPlaying(false);
        } else {
            setIsPlaying(true);
            playCurrentRecord();
        }
    };

    const handleNext = () => {
        window.speechSynthesis.cancel();
        const nextRecord = Math.min(currentRecord + 1, maxIndex);
        setCurrentRecord(nextRecord);
        updateFirstElement(nextRecord);
    };

    const handlePrev = () => {
        window.speechSynthesis.cancel();
        const prevRecord = Math.max(currentRecord - 1, 0);
        setCurrentRecord(prevRecord);
        updateFirstElement(prevRecord);
    };

    // Обработчик изменения значения индекса записи
    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleGo = () => {
        const value = Math.max(0, Math.min(Number(inputValue), maxIndex));
        setCurrentRecord(value); // Изменение текущей записи
        updateFirstElement(value);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleGo();
        }
    };

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <h5>{t('listen-dictionary')}</h5>

            <div className="d-flex flex-column gap-2">
                <div>
                    <label>{t('your-language')}</label>
                    <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                        {['en', 'de', 'fr', 'it', 'es', 'pt', 'pl', 'cs', 'uk', 'sh', 'ru', 'tr', 'ar', 'fa'].map((lang) => (
                            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>{t('reading-speed')}</label>
                    <select
                        value={readingSpeed}
                        onChange={(e) => setReadingSpeed(Number(e.target.value))}
                    >
                        {[0.25, 0.5, 0.75, 1].map((speed) => (
                            <option key={speed} value={speed}>{speed}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>{t('repeat-each-record')}</label>
                    <select
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(Number(e.target.value))}
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                            <option key={count} value={count}>{count}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>{t('current-record')}</label>
                    <div className="btn-group">
                        <Form.Control
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyUp={handleKeyPress}
                            className="rounded-start index-field"
                        />
                        <Button onClick={handleGo} variant="outline-dark">
                            <FaArrowRight />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="d-flex gap-2 mt-3">
                <button className="btn btn-outline-dark" onClick={handlePrev}>
                    <FaArrowLeft /> {t('prev')}
                </button>
                <button className="btn btn-dark" onClick={handlePlayPause}>
                    {isPlaying ? <FaPause /> : <FaPlay />} {isPlaying ? t('pause') : t('play')}
                </button>
                <button className="btn btn-outline-dark" onClick={handleNext}>
                    <FaArrowRight /> {t('next')}
                </button>
            </div>

            <div className="mt-3">
                {filteredData.length > 0 && (
                    <div>
                        <p>{`${filteredData[currentRecord]?.translation} = ${filteredData[currentRecord]?.foreignPart}`}</p>
                        <p>{t('record')}: {currentRecord}/{maxIndex}</p>
                        <p>{t('repeat')}: {currentRepeat.current}/{repeatCount}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DictionaryPlayer;