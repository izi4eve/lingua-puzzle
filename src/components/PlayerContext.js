import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';

// Начальное состояние плеера
const initialState = {
    currentRecord: 0,
    currentRepeat: 0,
    isPlaying: false,
    isSpeaking: false,
    isInDelay: false,
    showEditModal: false,
};

// Редьюсер для управления состоянием (тот же самый)
const playerReducer = (state, action) => {
    switch (action.type) {
        case 'SET_PLAYING':
            return { ...state, isPlaying: action.payload };
        case 'SET_SPEAKING':
            return { ...state, isSpeaking: action.payload };
        case 'SET_DELAY':
            return { ...state, isInDelay: action.payload };
        case 'SET_CURRENT_RECORD':
            return { ...state, currentRecord: action.payload, currentRepeat: 0, isSpeaking: false, isInDelay: false };
        case 'SET_CURRENT_REPEAT':
            return { ...state, currentRepeat: action.payload };
        case 'RESET_REPEAT':
            return { ...state, currentRepeat: 0 };
        case 'SET_MODAL':
            return { ...state, showEditModal: action.payload };
        case 'STOP_ALL':
            return { ...state, isPlaying: false, isSpeaking: false, isInDelay: false, currentRepeat: 0 };
        default:
            return state;
    }
};

// Создаем контекст
const PlayerContext = createContext();

// Провайдер компонента
export const PlayerProvider = ({ 
    children, 
    data,
    firstElement,
    updateFirstElement,
    ttsLanguage,
    selectedLanguage,
    languages,
    onMarkAsLearned,
    onEditEntry,
    onDeleteEntry,
    // Настройки плеера
    readingSpeed = 0.5,
    repeatCount = 3,
    selectedVoice = null,
    selectedVoiceYourLang = null,
    tipLanguage = 'en',
    selectedVoiceTip = null,
    delayBetweenRecords = 2,
    availableVoices = [],
}) => {
    const [playerState, dispatch] = useReducer(playerReducer, {
        ...initialState,
        currentRecord: firstElement
    });

    const delayTimeoutRef = useRef(null);
    const cancelTokenRef = useRef({ cancelled: false });
    const filteredData = data.filter((item) => !item.isLearned);

    // Функция для полной остановки воспроизведения
    const stopPlayback = useCallback(() => {
        window.speechSynthesis.cancel();
        cancelTokenRef.current.cancelled = true;
        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
        }
        dispatch({ type: 'STOP_ALL' });
    }, []);

    // Функция задержки с возможностью отмены
    const delayWithCancel = useCallback((seconds, sessionToken) => {
        return new Promise((resolve, reject) => {
            dispatch({ type: 'SET_DELAY', payload: true });
            delayTimeoutRef.current = setTimeout(() => {
                delayTimeoutRef.current = null;
                dispatch({ type: 'SET_DELAY', payload: false });
                if (!sessionToken.cancelled) {
                    resolve();
                } else {
                    reject(new Error('Playback stopped during delay'));
                }
            }, seconds * 1000);
        });
    }, []);

    // Функция воспроизведения аудио
    const playAudio = useCallback(async (text, lang, useReadingSpeed = false, voiceName = null) => {
        if (!window.speechSynthesis) {
            console.error('SpeechSynthesis is not supported.');
            return Promise.reject(new Error('SpeechSynthesis is not supported.'));
        }

        return new Promise((resolve, reject) => {
            if (cancelTokenRef.current?.cancelled) {
                reject(new Error('Cancelled'));
                return;
            }

            try {
                window.speechSynthesis.cancel();

                setTimeout(() => {
                    if (cancelTokenRef.current?.cancelled) {
                        reject(new Error('Cancelled'));
                        return;
                    }

                    const utterance = new SpeechSynthesisUtterance(text);
                    utterance.lang = lang;
                    utterance.rate = useReadingSpeed ? readingSpeed : 1.0;

                    if (voiceName) {
                        const voice = availableVoices.find(v => v.name === voiceName && v.lang.startsWith(lang));
                        if (voice) {
                            utterance.voice = voice;
                        }
                    }

                    utterance.onend = () => {
                        if (cancelTokenRef.current?.cancelled) {
                            reject(new Error('Cancelled'));
                        } else {
                            resolve();
                        }
                    };

                    utterance.onerror = (e) => {
                        reject(e);
                    };

                    if (cancelTokenRef.current?.cancelled) {
                        reject(new Error('Cancelled'));
                        return;
                    }

                    window.speechSynthesis.speak(utterance);
                }, 50);

            } catch (error) {
                reject(error);
            }
        });
    }, [readingSpeed, availableVoices]);

    // Функция для сброса токена отмены
    const resetCancelToken = useCallback(() => {
        cancelTokenRef.current = { cancelled: false };
    }, []);

    // Функция для перехода к следующей записи
    const handleNext = useCallback(() => {
        window.speechSynthesis.cancel();
        cancelTokenRef.current.cancelled = true;
        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
        }

        dispatch({ type: 'SET_SPEAKING', payload: false });
        dispatch({ type: 'SET_DELAY', payload: false });

        resetCancelToken();

        const nextRecord = playerState.currentRecord + 1;
        const maxIndex = Math.max(0, filteredData.length - 1);

        if (nextRecord > maxIndex) {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: 0 });
            dispatch({ type: 'RESET_REPEAT' });
            updateFirstElement(0);
        } else {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: nextRecord });
            dispatch({ type: 'RESET_REPEAT' });
            updateFirstElement(nextRecord);
        }
    }, [playerState.currentRecord, filteredData.length, updateFirstElement, resetCancelToken]);

    // Функция воспроизведения текущей записи
    const playCurrentRecord = useCallback(async () => {
        if (
            !window.speechSynthesis ||
            filteredData.length === 0 ||
            playerState.currentRecord < 0 ||
            playerState.currentRecord >= filteredData.length ||
            !playerState.isPlaying ||
            playerState.isSpeaking
        ) {
            return;
        }

        const sessionToken = { cancelled: false };
        cancelTokenRef.current = sessionToken;

        dispatch({ type: 'SET_SPEAKING', payload: true });

        const currentRecordAtStart = playerState.currentRecord;
        const currentRepeatAtStart = playerState.currentRepeat;
        const { foreignPart, translation, tipPart } = filteredData[currentRecordAtStart];

        try {
            const isPlayingAtStart = playerState.isPlaying;

            const shouldContinue = () => {
                return (
                    !sessionToken.cancelled &&
                    isPlayingAtStart &&
                    playerState.isPlaying &&
                    playerState.currentRecord === currentRecordAtStart &&
                    playerState.currentRepeat === currentRepeatAtStart
                );
            };

            if (!shouldContinue()) {
                dispatch({ type: 'SET_SPEAKING', payload: false });
                return;
            }
            await playAudio(translation, selectedLanguage, true, selectedVoiceYourLang);

            if (!shouldContinue()) {
                dispatch({ type: 'SET_SPEAKING', payload: false });
                return;
            }

            await new Promise(resolve => setTimeout(resolve, 100));

            if (!shouldContinue()) {
                dispatch({ type: 'SET_SPEAKING', payload: false });
                return;
            }

            await playAudio(foreignPart, ttsLanguage, true, selectedVoice);

            if (!shouldContinue()) {
                dispatch({ type: 'SET_SPEAKING', payload: false });
                return;
            }

            if (tipPart) {
                await new Promise(resolve => setTimeout(resolve, 100));

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    return;
                }

                await playAudio(tipPart, tipLanguage, true, selectedVoiceTip);

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    return;
                }
            }

            dispatch({ type: 'SET_SPEAKING', payload: false });

            const nextRepeat = currentRepeatAtStart + 1;

            if (nextRepeat < repeatCount) {
                dispatch({ type: 'SET_CURRENT_REPEAT', payload: nextRepeat });
            } else {
                dispatch({ type: 'RESET_REPEAT' });

                try {
                    await delayWithCancel(delayBetweenRecords, sessionToken);
                    if (shouldContinue()) {
                        handleNext();
                    }
                } catch (error) {
                    dispatch({ type: 'SET_DELAY', payload: false });
                }
            }
        } catch (error) {
            dispatch({ type: 'SET_SPEAKING', payload: false });
            dispatch({ type: 'SET_DELAY', payload: false });

            if (error.message !== 'Cancelled' && error.message !== 'Playback stopped during delay') {
                dispatch({ type: 'SET_PLAYING', payload: false });
            }
        }
    }, [
        playerState.isPlaying,
        playerState.currentRecord,
        playerState.currentRepeat,
        playerState.isSpeaking,
        filteredData,
        selectedLanguage,
        selectedVoiceYourLang,
        ttsLanguage,
        selectedVoice,
        tipLanguage,
        selectedVoiceTip,
        repeatCount,
        delayBetweenRecords,
        delayWithCancel,
        handleNext,
        playAudio
    ]);

    // Обработчик воспроизведения/паузы
    const handlePlayPause = () => {
        if (playerState.isPlaying) {
            stopPlayback();
        } else {
            resetCancelToken();
            dispatch({ type: 'SET_PLAYING', payload: true });
        }
    };

    // Обработчик перехода к предыдущей записи
    const handlePrev = () => {
        window.speechSynthesis.cancel();

        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancelled = true;
        }

        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
        }

        dispatch({ type: 'SET_SPEAKING', payload: false });
        dispatch({ type: 'SET_DELAY', payload: false });

        resetCancelToken();

        const prevRecord = Math.max(playerState.currentRecord - 1, 0);
        dispatch({ type: 'SET_CURRENT_RECORD', payload: prevRecord });
        dispatch({ type: 'RESET_REPEAT' });
        updateFirstElement(prevRecord);
    };

    // Обработчик перехода к первой записи
    const handleGoToFirst = () => {
        window.speechSynthesis.cancel();

        if (cancelTokenRef.current) {
            cancelTokenRef.current.cancelled = true;
        }

        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
        }

        dispatch({ type: 'SET_SPEAKING', payload: false });
        dispatch({ type: 'SET_DELAY', payload: false });

        resetCancelToken();

        dispatch({ type: 'SET_CURRENT_RECORD', payload: 0 });
        dispatch({ type: 'RESET_REPEAT' });
        updateFirstElement(0);
    };

    // Обработчик отметки как изученной
    const handleMarkAsLearned = () => {
        if (filteredData.length === 0) return;

        window.speechSynthesis.cancel();
        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
        }
        dispatch({ type: 'STOP_ALL' });

        const recordToMark = filteredData[playerState.currentRecord];
        if (onMarkAsLearned) {
            onMarkAsLearned(recordToMark);
        }

        const newFilteredData = filteredData.filter((_, index) => index !== playerState.currentRecord);

        if (newFilteredData.length === 0) {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: 0 });
            dispatch({ type: 'RESET_REPEAT' });
            updateFirstElement(0);
            return;
        }

        if (playerState.currentRecord >= newFilteredData.length) {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: 0 });
            dispatch({ type: 'RESET_REPEAT' });
            updateFirstElement(0);
        } else {
            updateFirstElement(playerState.currentRecord);
        }
    };

    // Обработчики модального окна редактирования
    const handleEditClick = () => {
        dispatch({ type: 'SET_MODAL', payload: true });
    };

    const handleEditSave = (updatedEntry) => {
        if (filteredData.length === 0) return;

        const currentEntry = filteredData[playerState.currentRecord];
        if (onEditEntry) {
            onEditEntry(currentEntry, updatedEntry);
        }
        dispatch({ type: 'SET_MODAL', payload: false });
    };

    const handleEditDelete = () => {
        if (filteredData.length === 0) return;

        const currentEntry = filteredData[playerState.currentRecord];
        if (onDeleteEntry) {
            onDeleteEntry(currentEntry);
        }
        dispatch({ type: 'SET_MODAL', payload: false });
    };

    // Синхронизация currentRecord с firstElement
    useEffect(() => {
        const maxIndex = Math.max(0, filteredData.length - 1);
        const newRecord = Math.min(firstElement, maxIndex);
        if (newRecord !== playerState.currentRecord) {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: newRecord });
        }
    }, [firstElement, filteredData.length, playerState.currentRecord]);

    // Эффект для воспроизведения
    useEffect(() => {
        if (playerState.isPlaying && filteredData.length > 0 &&
            !playerState.isSpeaking && !playerState.isInDelay) {
            playCurrentRecord();
        } else if (filteredData.length === 0) {
            dispatch({ type: 'SET_PLAYING', payload: false });
        }
    }, [
        playerState.isPlaying,
        playerState.currentRecord,
        playerState.currentRepeat,
        playerState.isSpeaking,
        playerState.isInDelay,
        filteredData.length,
        playCurrentRecord
    ]);

    // Мониторинг speechSynthesis
    useEffect(() => {
        if (!playerState.isPlaying) return;

        const checkSynthesis = () => {
            if (window.speechSynthesis.speaking ||
                window.speechSynthesis.pending ||
                playerState.isSpeaking ||
                playerState.isInDelay) {
                return;
            }

            if (playerState.isPlaying && !cancelTokenRef.current?.cancelled) {
                playCurrentRecord();
            }
        };

        const interval = setInterval(checkSynthesis, 1000);
        return () => clearInterval(interval);
    }, [playerState.isPlaying, playerState.isSpeaking, playerState.isInDelay, playCurrentRecord]);

    // Очистка таймаута при размонтировании
    useEffect(() => {
        return () => {
            if (delayTimeoutRef.current) {
                clearTimeout(delayTimeoutRef.current);
            }
        };
    }, []);

    // Значение контекста
    const contextValue = {
        // Состояние
        playerState,
        dispatch,
        filteredData,
        currentEntry: filteredData[playerState.currentRecord],
        
        // Методы
        handlePlayPause,
        handleNext,
        handlePrev,
        handleGoToFirst,
        handleMarkAsLearned,
        handleEditClick,
        handleEditSave,
        handleEditDelete,
    };

    return (
        <PlayerContext.Provider value={contextValue}>
            {children}
        </PlayerContext.Provider>
    );
};

// Хук для использования контекста
export const usePlayerContext = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayerContext must be used within a PlayerProvider');
    }
    return context;
};