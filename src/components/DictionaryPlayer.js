import React, { useCallback, useEffect, useState } from 'react';
import { Button, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { FaArrowRight, FaPause, FaPlay } from "react-icons/fa";
import { TbCircleNumber4Filled, TbPlayerTrackNextFilled, TbPlayerTrackPrevFilled } from "react-icons/tb";
import Title from './Title';
import PreventScreenSleep from './PreventScreenSleep';

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
    const [recordsToPlay, setRecordsToPlay] = useState(10); // Новое состояние для количества записей

    const filteredData = data.filter((item) => !item.isLearned); // Фильтруем записи
    const maxIndex = filteredData.length - 1;

    // Эффект для отслеживания изменений в data
    useEffect(() => {
        if (data.length > 0) {
            setIsPlaying(false); // Останавливаем воспроизведение
            window.speechSynthesis.cancel(); // Прекращаем текущее воспроизведение
            setCurrentRecord(0); // Сбрасываем текущую запись на первую
            updateFirstElement(0); // Обновляем firstElement в родительском компоненте
            setInputValue('0'); // Сбрасываем значение в поле ввода
        }
    }, [data, updateFirstElement]);

    useEffect(() => {
        if (!window.speechSynthesis) {
            alert('SpeechSynthesis is not supported in your browser.');
        }
    }, []);

    // Сохранение параметров в localStorage
    useEffect(() => {
        const savedSettings = localStorage.getItem('playerSettings');
        if (savedSettings) {
            const { selectedLanguage, readingSpeed, repeatCount, recordsToPlay } = JSON.parse(savedSettings);
            setSelectedLanguage(selectedLanguage);
            setReadingSpeed(readingSpeed);
            setRepeatCount(repeatCount);
            setRecordsToPlay(recordsToPlay || 10); // Если recordsToPlay не сохранено, используем 10
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('playerSettings', JSON.stringify({
            selectedLanguage,
            readingSpeed,
            repeatCount,
            recordsToPlay,
        }));
    }, [selectedLanguage, readingSpeed, repeatCount, recordsToPlay]);

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

        const nextRecord = currentRecord + 1;
        const maxRecordToPlay = recordsToPlay === Infinity ? maxIndex : Math.min(maxIndex, recordsToPlay - 1);

        if (nextRecord > maxRecordToPlay) {
            setCurrentRecord(0); // Начинаем сначала, если достигли конца
            updateFirstElement(0);
        } else {
            setCurrentRecord(nextRecord);
            updateFirstElement(nextRecord);
        }
    }, [currentRecord, maxIndex, recordsToPlay, updateFirstElement]);

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

    const handlePlayPause = useCallback(() => {
        if (isPlaying) {
            window.speechSynthesis.cancel(); // Прекращаем текущее воспроизведение
            setIsPlaying(false); // Останавливаем режим воспроизведения
            setIsSpeaking(false); // Сбрасываем флаг воспроизведения
            setCurrentRepeat(0); // Сбрасываем счётчик повторов
        } else {
            setIsPlaying(true); // Включаем режим воспроизведения
            playCurrentRecord(); // Запускаем текущую запись
        }
    }, [isPlaying, playCurrentRecord]);

    const handlePrev = useCallback(() => {
        window.speechSynthesis.cancel(); // Прекращаем текущее проигрывание
        setIsSpeaking(false); // Сбрасываем состояние, чтобы позволить новый запуск
        setCurrentRepeat(0); // Сбрасываем счётчик повторов
        const prevRecord = Math.max(currentRecord - 1, 0);
        setCurrentRecord(prevRecord);
        updateFirstElement(prevRecord);
    }, [currentRecord, updateFirstElement]);

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

    useEffect(() => {
        if ('mediaSession' in navigator) {
            navigator.mediaSession.metadata = new window.MediaMetadata({
                title: 'Dictionary Player',
                artist: 'Language Learning',
                album: 'Your App',
                artwork: [
                    { src: 'icon.png', sizes: '96x96', type: 'image/png' },
                    { src: 'icon-large.png', sizes: '512x512', type: 'image/png' },
                ]
            });

            navigator.mediaSession.setActionHandler('play', handlePlayPause);
            navigator.mediaSession.setActionHandler('pause', handlePlayPause);
            navigator.mediaSession.setActionHandler('nexttrack', handleNext);
            navigator.mediaSession.setActionHandler('previoustrack', handlePrev);
        }
    }, [handlePlayPause, handleNext, handlePrev]);

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <PreventScreenSleep isPlaying={isPlaying} />

            <Title icon={<TbCircleNumber4Filled size={28} />} text={t('listen-dictionary')} />

            <div className="d-flex flex-row flex-wrap gap-2">
                <div className="d-flex align-items-center">
                    <label>{t('your-language')}</label>
                    <Form.Select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="ms-2 w-auto"
                    >
                        {['en', 'de', 'fr', 'it', 'es', 'pt', 'pl', 'cs', 'uk', 'sh', 'ru', 'tr', 'ar', 'fa'].map((lang) => (
                            <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                        ))}
                    </Form.Select>
                </div>

                <div className="d-flex align-items-center">
                    <label>{t('learning-language')}</label>
                    <Form.Select
                        value={ttsLanguage}
                        onChange={(e) => onTTSLanguageChange(e.target.value)}
                        className="ms-2 w-auto"
                    >
                        {languages.map((lang) => (
                            <option key={lang.code} value={lang.code}>{lang.name}</option>
                        ))}
                    </Form.Select>
                </div>

                <div className="d-flex align-items-center">
                    <label>{t('reading-speed')}</label>
                    <Form.Select
                        value={readingSpeed}
                        onChange={(e) => setReadingSpeed(Number(e.target.value))}
                        className="ms-2 w-auto"
                    >
                        {[0.25, 0.5, 0.75, 1].map((speed) => (
                            <option key={speed} value={speed}>{speed}</option>
                        ))}
                    </Form.Select>
                </div>

                <div className="d-flex align-items-center">
                    <label>{t('repeat-each-record')}</label>
                    <Form.Select
                        value={repeatCount}
                        onChange={(e) => setRepeatCount(Number(e.target.value))}
                        className="ms-2 w-auto"
                    >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((count) => (
                            <option key={count} value={count}>{count}</option>
                        ))}
                    </Form.Select>
                </div>

                <div className="d-flex align-items-center">
                    <label>{t('records-to-play')}</label>
                    <Form.Select
                        value={recordsToPlay === Infinity ? 'all' : recordsToPlay} // Отображаем 'all' для Infinity
                        onChange={(e) => {
                            const value = e.target.value === 'all' ? Infinity : Number(e.target.value);
                            setRecordsToPlay(value);
                        }}
                        className="ms-2 w-auto"
                    >
                        {[10, 20, 30, 50, 100, 200, 300, 500, 1000, 'all'].map((count) => (
                            <option key={count} value={count === 'all' ? 'all' : count}>
                                {count === 'all' ? t('all') : count}
                            </option>
                        ))}
                    </Form.Select>
                </div>

                <div className="d-flex align-items-center">
                    <label>{t('current-record')}</label>
                    <div className="btn-group">
                        <Form.Control
                            type="text"
                            value={inputValue}
                            onChange={handleInputChange}
                            onKeyUp={handleKeyPress}
                            className="ms-2 rounded-start index-field"
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
                        <p className="fs-5 fw-bold">
                            <span className="text-success">{`${filteredData[currentRecord]?.foreignPart}`}</span>
                            <span> = </span>
                            <span>{`${filteredData[currentRecord]?.translation}`}</span>
                        </p>
                        <div className="d-flex gap-3">
                            <div>{t('record')}: <span className="fw-bold">{currentRecord + 1}/{maxIndex + 1}</span></div>
                            <div>{t('repeat')}: <span className="fw-bold">{currentRepeat + 1}/{repeatCount}</span></div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DictionaryPlayer;