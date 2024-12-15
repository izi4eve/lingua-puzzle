import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Title from './Title';
import { FaPlay, FaPause, FaArrowRight } from "react-icons/fa";
import { TbCircleNumber4Filled, TbPlayerTrackPrevFilled, TbPlayerTrackNextFilled } from "react-icons/tb";
import { Button, Form } from 'react-bootstrap';

const DictionaryPlayer = ({ data, firstElement, updateFirstElement, ttsLanguage, onTTSLanguageChange, languages }) => {
    const { t } = useTranslation();

    const [currentRecord, setCurrentRecord] = useState(firstElement); // Нумерация от 0
    const [repeatCount, setRepeatCount] = useState(3);
    const [currentRepeat, setCurrentRepeat] = useState(0); // Состояние для текущего повтора
    const [isPlaying, setIsPlaying] = useState(false);
    const [selectedLanguage, setSelectedLanguage] = useState(ttsLanguage);
    const [readingSpeed, setReadingSpeed] = useState(0.5);
    const [inputValue, setInputValue] = useState(firstElement.toString());
    const [isSpeaking, setIsSpeaking] = useState(false); // Условие, чтобы избежать повторов

    const filteredData = data.filter((item) => !item.isLearned); // Фильтруем записи
    const maxIndex = filteredData.length - 1;

    useEffect(() => {
        if (!window.speechSynthesis) {
            alert('SpeechSynthesis is not supported in your browser.');
        }
    }, []);

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

    // Синхронизация currentRecord с firstElement
    useEffect(() => {
        setCurrentRecord(firstElement);
        setInputValue(firstElement.toString());
    }, [firstElement]);

    const playAudio = useCallback(async (text, lang) => {
        if (!window.speechSynthesis) {
            alert('SpeechSynthesis is not supported in your browser.');
            return Promise.reject(new Error('SpeechSynthesis is not supported.'));
        }

        return new Promise((resolve, reject) => {
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = lang;
                utterance.rate = readingSpeed;

                utterance.onend = () => resolve(); // Завершаем промис по завершении речи
                utterance.onerror = (e) => reject(e); // Обрабатываем ошибки

                window.speechSynthesis.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
    }, [readingSpeed]);

    const handleNext = useCallback(() => {
        window.speechSynthesis.cancel(); // Прекращаем текущее проигрывание
        setIsSpeaking(false); // Сбрасываем состояние, чтобы позволить новый запуск
        setCurrentRepeat(0); // Сбрасываем счётчик повторов
        const nextRecord = Math.min(currentRecord + 1, maxIndex);
        setCurrentRecord(nextRecord);
        updateFirstElement(nextRecord);
    }, [currentRecord, maxIndex, updateFirstElement]);

    const playCurrentRecord = useCallback(async () => {
        if (!window.speechSynthesis) {
            alert('SpeechSynthesis is not supported in your browser.');
            return;
        }

        if (currentRecord < 0 || currentRecord > maxIndex || isSpeaking) return;

        setIsSpeaking(true); // Предотвращаем повторный запуск

        const { foreignPart, translation } = filteredData[currentRecord];

        try {
            await playAudio(translation, selectedLanguage);
            await playAudio(foreignPart, ttsLanguage);

            setCurrentRepeat((prev) => {
                const nextRepeat = prev + 1;
                if (nextRepeat < repeatCount) {
                    setIsSpeaking(false); // Разрешаем повторный запуск
                    playCurrentRecord(); // Повтор записи
                } else {
                    setCurrentRepeat(0); // Сброс счётчика повторов
                    setIsSpeaking(false); // Разрешаем запуск следующей записи
                    handleNext(); // Переход к следующей записи
                }
                return nextRepeat;
            });
        } catch (error) {
            console.error("Ошибка воспроизведения аудио:", error);
            setIsSpeaking(false); // Сбрасываем состояние, даже если произошла ошибка
        }
    }, [
        currentRecord,
        maxIndex,
        filteredData,
        selectedLanguage,
        ttsLanguage,
        repeatCount,
        handleNext,
        isSpeaking,
        playAudio,
    ]);

    // Автопроигрывание после изменения currentRecord
    useEffect(() => {
        if (isPlaying) {
            playCurrentRecord();
        }
    }, [currentRecord, isPlaying, playCurrentRecord]);

    const handlePlayPause = () => {
        if (isPlaying) {
            window.speechSynthesis.cancel(); // Прекращаем текущее воспроизведение
            setIsPlaying(false); // Останавливаем режим воспроизведения
            setIsSpeaking(false); // Сбрасываем флаг воспроизведения
            setCurrentRepeat(0); // Сбрасываем счётчик повторов
        } else {
            setIsPlaying(true); // Включаем режим воспроизведения
            playCurrentRecord(); // Запускаем текущую запись
        }
    };

    const handlePrev = () => {
        window.speechSynthesis.cancel(); // Прекращаем текущее проигрывание
        setIsSpeaking(false); // Сбрасываем состояние, чтобы позволить новый запуск
        setCurrentRepeat(0); // Сбрасываем счётчик повторов
        const prevRecord = Math.max(currentRecord - 1, 0);
        setCurrentRecord(prevRecord);
        updateFirstElement(prevRecord);
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleGo = () => {
        const value = Math.max(0, Math.min(Number(inputValue), maxIndex));
        setCurrentRecord(value); // Обновляем currentRecord
        updateFirstElement(value); // Уведомляем родительский компонент
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleGo();
        }
    };

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<TbCircleNumber4Filled size={28} />} text={t('listen-dictionary')} />

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
                    <label>{t('learning-language')}</label>
                    <select
                        value={ttsLanguage}
                        onChange={(e) => onTTSLanguageChange(e.target.value)}
                    >
                        {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
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

            <div className="btn-group mt-3">
                <button className="btn btn-lg rounded-start-pill btn-outline-dark pt-1" onClick={handlePrev}>
                    <TbPlayerTrackPrevFilled />
                </button>
                <button className="btn btn-lg btn-dark pt-1" onClick={handlePlayPause}>
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
                <button className="btn btn-lg rounded-end-circle btn-outline-dark pt-1" onClick={handleNext}>
                    <TbPlayerTrackNextFilled />
                </button>
            </div>

            <div className="mt-3">
                {filteredData.length > 0 && (
                    <div>
                        <p>{`${filteredData[currentRecord]?.translation} = ${filteredData[currentRecord]?.foreignPart}`}</p>
                        <p>{t('record')}: {currentRecord}/{maxIndex}</p>
                        <p>{t('repeat')}: {currentRepeat + 1}/{repeatCount}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DictionaryPlayer;