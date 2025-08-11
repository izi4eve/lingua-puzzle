import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect, useMemo } from 'react';
// Начальное состояние плеера
const getInitialState = () => {
    const saved = localStorage.getItem('playerGlobalState');
    if (saved) {
        const parsedState = JSON.parse(saved);
        return {
            ...parsedState,
            showEditModal: false, // Всегда false при инициализации
        };
    }
    return {
        currentRecord: 0,
        currentRepeat: 0,
        isPlaying: false,
        isSpeaking: false,
        isInDelay: false,
        showEditModal: false,
    };
};
// Редьюсер для управления состоянием
const playerReducer = (state, action) => {
    switch (action.type) {
        case 'SET_PLAYING':
            return { ...state, isPlaying: action.payload };
        case 'SET_SPEAKING':
            return { ...state, isSpeaking: action.payload };
        case 'SET_DELAY':
            return { ...state, isInDelay: action.payload };
        // ВАЖНО: При сбросе записи также сбрасываем currentRepeat, isSpeaking, isInDelay
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
    foreignLanguage,        // переименовано с ttsLanguage
    translationLanguage,    // переименовано с selectedLanguage
    tipLanguage,
    ttsLanguages,          // переименовано с languages
    onMarkAsLearned,
    onEditEntry,
    onDeleteEntry,
    // Настройки плеера
    readingSpeed = 0.5,
    repeatCount = 3,
    selectedVoiceForeign = null,        // переименовано с selectedVoice
    selectedVoiceTranslation = null,    // переименовано с selectedVoiceYourLang
    selectedVoiceTip = null,
    delayBetweenRecords = 2,
    availableVoices = [],
    recordsToPlay = Infinity,
    onRequestPause,
}) => {
    const [playerState, dispatch] = useReducer(playerReducer, {
        ...getInitialState(),
        currentRecord: firstElement
    });

    // Синхронизация состояния с localStorage
    useEffect(() => {
        localStorage.setItem('playerGlobalState', JSON.stringify({
            currentRecord: playerState.currentRecord,
            currentRepeat: playerState.currentRepeat,
            isPlaying: playerState.isPlaying,
            isSpeaking: playerState.isSpeaking,
            isInDelay: playerState.isInDelay,
        }));
    }, [playerState.currentRecord, playerState.currentRepeat, playerState.isPlaying, playerState.isSpeaking, playerState.isInDelay]);

    // Слушатель изменений localStorage для синхронизации между экземплярами
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'playerGlobalState' && e.newValue) {
                const newState = JSON.parse(e.newValue);
                // Сброс currentRepeat при изменении записи из другого экземпляра
                dispatch({ type: 'SET_CURRENT_RECORD', payload: newState.currentRecord });
                // dispatch({ type: 'SET_CURRENT_REPEAT', payload: newState.currentRepeat }); // Не синхронизируем repeat
                dispatch({ type: 'SET_PLAYING', payload: newState.isPlaying });
                dispatch({ type: 'SET_SPEAKING', payload: newState.isSpeaking });
                dispatch({ type: 'SET_DELAY', payload: newState.isInDelay });
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const delayTimeoutRef = useRef(null);
    const cancelTokenRef = useRef({ cancelled: false });

    // Мемоизируем filteredData и recordsToPlayData
    const filteredData = useMemo(() =>
        data.filter((item) => !item.isLearned),
        [data]
    );

    const recordsToPlayData = useMemo(() =>
        recordsToPlay === Infinity
            ? filteredData
            : filteredData.slice(0, Math.min(recordsToPlay, filteredData.length)),
        [filteredData, recordsToPlay]
    );

    // Функция для получения TTS кода языка
    const getTTSLanguageCode = useCallback((langCode) => {
        const ttsLang = ttsLanguages.find(lang => lang.code.startsWith(langCode));
        return ttsLang ? ttsLang.code : `${langCode}-${langCode.toUpperCase()}`;
    }, [ttsLanguages]);

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
    const playAudio = useCallback(async (text, langCode, useReadingSpeed = false, voiceName = null) => {
        if (!window.speechSynthesis) {
            console.error('SpeechSynthesis is not supported.');
            return Promise.reject(new Error('SpeechSynthesis is not supported.'));
        }

        // Ждем полной остановки предыдущего воспроизведения
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
            await new Promise(resolve => setTimeout(resolve, 100)); // Уменьшено время ожидания
        }

        return new Promise((resolve, reject) => {
            if (cancelTokenRef.current?.cancelled) {
                reject(new Error('Cancelled'));
                return;
            }
            try {
                const utterance = new SpeechSynthesisUtterance(text);
                // Получаем правильный TTS код для языка
                utterance.lang = getTTSLanguageCode(langCode);
                utterance.rate = useReadingSpeed ? readingSpeed : 1.0;
                if (voiceName) {
                    const voice = availableVoices.find(v => v.name === voiceName && v.lang.startsWith(langCode));
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
                    console.error("SpeechSynthesis Error:", e);
                    reject(e);
                };
                if (cancelTokenRef.current?.cancelled) {
                    reject(new Error('Cancelled'));
                    return;
                }
                window.speechSynthesis.speak(utterance);
            } catch (error) {
                reject(error);
            }
        });
    }, [readingSpeed, availableVoices, getTTSLanguageCode]);

    // Функция для сброса токена отмены
    const resetCancelToken = useCallback(() => {
        cancelTokenRef.current = { cancelled: false };
    }, []);

    // Функция для перехода к следующей записи
    const handleNext = useCallback(() => {
        // window.speechSynthesis.cancel(); // Убираем отсюда, т.к. playCurrentRecord делает это внутри
        cancelTokenRef.current.cancelled = true;
        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
        }
        dispatch({ type: 'SET_SPEAKING', payload: false });
        dispatch({ type: 'SET_DELAY', payload: false });
        resetCancelToken();

        const nextRecord = playerState.currentRecord + 1;
        const maxIndex = Math.max(0, recordsToPlayData.length - 1);

        if (nextRecord > maxIndex) {
            // Если дошли до конца, останавливаем воспроизведение
            dispatch({ type: 'SET_PLAYING', payload: false });
            // dispatch({ type: 'SET_CURRENT_RECORD', payload: 0 }); // Не сбрасываем на 0, если закончили
            // dispatch({ type: 'RESET_REPEAT' });
            // updateFirstElement(0);
        } else {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: nextRecord });
            // dispatch({ type: 'RESET_REPEAT' }); // Сброс повторений происходит в редьюсере при SET_CURRENT_RECORD
            updateFirstElement(nextRecord);
        }
    }, [playerState.currentRecord, recordsToPlayData.length, updateFirstElement, resetCancelToken]);

    // Функция воспроизведения текущей записи
    const playCurrentRecord = useCallback(async () => {
        // Ждем полной остановки предыдущего воспроизведения
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
            await new Promise(resolve => setTimeout(resolve, 100)); // Уменьшено время ожидания
        }

        // Проверяем корректность данных и состояния
        if (
            !window.speechSynthesis ||
            recordsToPlayData.length === 0 ||
            playerState.currentRecord < 0 ||
            playerState.currentRecord >= recordsToPlayData.length ||
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
        const { foreignPart, translation, tipPart } = recordsToPlayData[currentRecordAtStart];

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

            // Сначала читаем translation на языке translationLanguage с голосом selectedVoiceTranslation
            if (!shouldContinue()) {
                dispatch({ type: 'SET_SPEAKING', payload: false });
                return;
            }
            await playAudio(translation, translationLanguage, true, selectedVoiceTranslation);

            if (!shouldContinue()) {
                dispatch({ type: 'SET_SPEAKING', payload: false });
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 100));

            // Затем читаем foreignPart на языке foreignLanguage с голосом selectedVoiceForeign
            if (!shouldContinue()) {
                dispatch({ type: 'SET_SPEAKING', payload: false });
                return;
            }
            await playAudio(foreignPart, foreignLanguage, true, selectedVoiceForeign);

            if (!shouldContinue()) {
                dispatch({ type: 'SET_SPEAKING', payload: false });
                return;
            }

            // Если есть tipPart, читаем его на языке tipLanguage с голосом selectedVoiceTip
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
                dispatch({ type: 'RESET_REPEAT' }); // Сброс повторений
                try {
                    await delayWithCancel(delayBetweenRecords, sessionToken);
                    if (shouldContinue()) {
                        handleNext();
                    }
                } catch (error) {
                    dispatch({ type: 'SET_DELAY', payload: false });
                    // Не останавливаем воспроизведение при ошибке задержки
                }
            }
        } catch (error) {
            dispatch({ type: 'SET_SPEAKING', payload: false });
            dispatch({ type: 'SET_DELAY', payload: false });
            // Останавливаем воспроизведение только при критических ошибках, отличных от отмены
            if (error.message !== 'Cancelled' && error.message !== 'Playback stopped during delay') {
                console.error("Error in playCurrentRecord:", error);
                dispatch({ type: 'SET_PLAYING', payload: false });
            }
        }
    }, [
        playerState.isPlaying,
        playerState.currentRecord,
        playerState.currentRepeat,
        playerState.isSpeaking,
        recordsToPlayData, // ВАЖНО: используем recordsToPlayData
        foreignLanguage,
        translationLanguage,
        tipLanguage,
        selectedVoiceForeign,
        selectedVoiceTranslation,
        selectedVoiceTip,
        repeatCount,
        delayBetweenRecords,
        delayWithCancel,
        handleNext,
        playAudio
    ]);

    // Обработчик воспроизведения/паузы
    const handlePlayPause = useCallback(() => {
        if (playerState.isPlaying) {
            stopPlayback();
        } else {
            // Принудительно останавливаем любое активное воспроизведение
            window.speechSynthesis.cancel();
            // Сброс внутреннего состояния
            dispatch({ type: 'SET_SPEAKING', payload: false });
            dispatch({ type: 'SET_DELAY', payload: false });
            // Небольшая задержка для корректной остановки
            setTimeout(() => {
                resetCancelToken();
                dispatch({ type: 'SET_PLAYING', payload: true });
            }, 100);
        }
    }, [playerState.isPlaying, stopPlayback, resetCancelToken]);

    // Обработчик перехода к предыдущей записи
    const handlePrev = useCallback(() => {
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

        const maxIndex = Math.max(0, recordsToPlayData.length - 1);
        // Позволяем перейти к последней записи, если текущая первая
        const prevRecord = playerState.currentRecord <= 0 ? maxIndex : playerState.currentRecord - 1;
        dispatch({ type: 'SET_CURRENT_RECORD', payload: prevRecord });
        // dispatch({ type: 'RESET_REPEAT' }); // Сброс повторений происходит в редьюсере
        updateFirstElement(prevRecord);
    }, [playerState.currentRecord, recordsToPlayData.length, updateFirstElement, resetCancelToken]);

    // Обработчик перехода к первой записи
    const handleGoToFirst = useCallback(() => {
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
        // dispatch({ type: 'RESET_REPEAT' }); // Сброс повторений происходит в редьюсере
        updateFirstElement(0);
    }, [resetCancelToken, updateFirstElement]);

    // Обработчик отметки как изученной
    const handleMarkAsLearned = useCallback(() => {
        if (recordsToPlayData.length === 0) return;
        window.speechSynthesis.cancel();
        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
        }
        dispatch({ type: 'STOP_ALL' });
        const recordToMark = recordsToPlayData[playerState.currentRecord];
        if (onMarkAsLearned) {
            onMarkAsLearned(recordToMark);
        }
        // После удаления записи пересчитываем массив
        const newRecordsToPlayData = recordsToPlay === Infinity ?
            data.filter((item) => !item.isLearned) :
            data.filter((item) => !item.isLearned).slice(0, Math.min(recordsToPlay, data.filter((item) => !item.isLearned).length));

        if (newRecordsToPlayData.length === 0) {
            // Если не осталось записей, останавливаем воспроизведение
            dispatch({ type: 'SET_PLAYING', payload: false });
            dispatch({ type: 'SET_CURRENT_RECORD', payload: 0 });
            // dispatch({ type: 'RESET_REPEAT' }); // Сброс повторений происходит в редьюсере
            updateFirstElement(0);
            return;
        }

        // Если текущая запись больше или равна новой длине, переходим к последней доступной
        if (playerState.currentRecord >= newRecordsToPlayData.length) {
            const newIndex = Math.max(0, newRecordsToPlayData.length - 1);
            dispatch({ type: 'SET_CURRENT_RECORD', payload: newIndex });
            // dispatch({ type: 'RESET_REPEAT' }); // Сброс повторений происходит в редьюсере
            updateFirstElement(newIndex);
        } else {
            // Иначе, просто обновляем firstElement
            updateFirstElement(playerState.currentRecord);
        }
    }, [recordsToPlayData, playerState.currentRecord, onMarkAsLearned, data, recordsToPlay, updateFirstElement]);

    // Обработчики модального окна редактирования
    const handleEditClick = useCallback(() => {
        dispatch({ type: 'SET_MODAL', payload: true });
    }, []);

    const handleEditSave = useCallback((updatedEntry) => {
        if (recordsToPlayData.length === 0) return; // Используем recordsToPlayData
        const currentEntry = recordsToPlayData[playerState.currentRecord]; // Используем recordsToPlayData
        if (onEditEntry) {
            onEditEntry(currentEntry, updatedEntry);
        }
        dispatch({ type: 'SET_MODAL', payload: false });
    }, [recordsToPlayData, playerState.currentRecord, onEditEntry]); // Используем recordsToPlayData

    const handleEditDelete = useCallback(() => {
        if (recordsToPlayData.length === 0) return; // Используем recordsToPlayData
        const currentEntry = recordsToPlayData[playerState.currentRecord]; // Используем recordsToPlayData
        if (onDeleteEntry) {
            onDeleteEntry(currentEntry);
        }
        dispatch({ type: 'SET_MODAL', payload: false });
    }, [recordsToPlayData, playerState.currentRecord, onDeleteEntry]); // Используем recordsToPlayData

    // Синхронизация currentRecord с firstElement
    useEffect(() => {
        const maxIndex = Math.max(0, recordsToPlayData.length - 1);
        const newRecord = Math.min(firstElement, maxIndex);
        // Обновляем только если индекс действительно изменился
        if (newRecord !== playerState.currentRecord) {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: newRecord });
        }
    }, [firstElement, recordsToPlayData.length, playerState.currentRecord]);

    // Эффект для воспроизведения
    useEffect(() => {
        if (playerState.isPlaying && recordsToPlayData.length > 0 && // Используем recordsToPlayData
            !playerState.isSpeaking && !playerState.isInDelay) {
            playCurrentRecord();
        } else if (recordsToPlayData.length === 0) { // Используем recordsToPlayData
            dispatch({ type: 'SET_PLAYING', payload: false });
        }
    }, [
        playerState.isPlaying,
        playerState.currentRecord,
        playerState.currentRepeat,
        playerState.isSpeaking,
        playerState.isInDelay,
        recordsToPlayData.length, // Используем recordsToPlayData
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

    const handlePause = useCallback(() => {
        if (playerState.isPlaying) {
            stopPlayback();
        }
    }, [playerState.isPlaying, stopPlayback]);

    useEffect(() => {
        if (onRequestPause && typeof onRequestPause === 'function') {
            onRequestPause(handlePause);
        }
    }, [onRequestPause, handlePause]);

    // Значение контекста
    const contextValue = {
        // Состояние
        playerState,
        dispatch,
        filteredData,  // Передаем filteredData для UI, если нужно
        recordsToPlayData, // Передаем recordsToPlayData для UI, если нужно
        // ВАЖНО: currentEntry должен использовать тот же источник данных, что и playCurrentRecord
        currentEntry: recordsToPlayData[playerState.currentRecord], // Используем recordsToPlayData
        // Методы
        handlePlayPause,
        handleNext,
        handlePrev,
        handleGoToFirst,
        handleMarkAsLearned,
        handleEditClick,
        handleEditSave,
        handleEditDelete,
        handlePause,
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