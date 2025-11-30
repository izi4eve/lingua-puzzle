import React, { createContext, useContext, useReducer, useRef, useCallback, useEffect } from 'react';

const getInitialState = (instanceId) => {
    const saved = localStorage.getItem(`playerGlobalState-${instanceId}`);
    if (saved) {
        try {
            const parsedState = JSON.parse(saved);
            return {
                currentRepeat: parsedState.currentRepeat || 0,
                isPlaying: false,
                isSpeaking: false,
                isInDelay: false,
                showEditModal: false,
            };
        } catch (e) {
            console.error('Failed to parse playerGlobalState:', e);
        }
    }
    return {
        currentRepeat: 0,
        isPlaying: false,
        isSpeaking: false,
        isInDelay: false,
        showEditModal: false,
    };
};

const playerReducer = (state, action) => {
    switch (action.type) {
        case 'SET_PLAYING':
            return { ...state, isPlaying: action.payload };
        case 'SET_SPEAKING':
            return { ...state, isSpeaking: action.payload };
        case 'SET_DELAY':
            return { ...state, isInDelay: action.payload };
        case 'SET_CURRENT_RECORD':
            if (isNaN(action.payload)) {
                console.error('❌ SET_CURRENT_RECORD received NaN!', action.payload);
                return state;
            }
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

const PlayerContext = createContext();

export const PlayerProvider = ({
    children,
    data,
    firstElement,
    updateFirstElement,
    foreignLanguage,
    translationLanguage,
    tipLanguage,
    ttsLanguages,
    onMarkAsLearned,
    onEditEntry,
    onDeleteEntry,
    readingSpeed = 0.5,
    repeatCount = 3,
    selectedVoiceForeign = null,
    selectedVoiceTranslation = null,
    selectedVoiceTip = null,
    delayBetweenRecords = 2,
    availableVoices = [],
    recordsToPlay = Infinity,
}) => {
    const instanceId = useRef(`player-${Math.random().toString(36).substr(2, 9)}`).current;
    const isPlayingRef = useRef(false);

    const [playerState, dispatch] = useReducer(playerReducer, {
        ...getInitialState(instanceId),
        currentRecord: typeof firstElement === 'number' && !isNaN(firstElement) ? firstElement : 0
    });

    useEffect(() => {
        localStorage.setItem(`playerGlobalState-${instanceId}`, JSON.stringify({
            currentRepeat: playerState.currentRepeat,
            isPlaying: playerState.isPlaying,
            isSpeaking: playerState.isSpeaking,
            isInDelay: playerState.isInDelay,
        }));
    }, [playerState.currentRepeat, playerState.isPlaying, playerState.isSpeaking, playerState.isInDelay, instanceId]);

    const delayTimeoutRef = useRef(null);
    const cancelTokenRef = useRef({ cancelled: false });
    const filteredData = data.filter((item) => !item.isLearned);

    const getTTSLanguageCode = useCallback((langCode) => {
        const ttsLang = ttsLanguages.find(lang => lang.code.startsWith(langCode));
        return ttsLang ? ttsLang.code : `${langCode}-${langCode.toUpperCase()}`;
    }, [ttsLanguages]);

    const stopPlayback = useCallback(() => {
        window.speechSynthesis.cancel();
        cancelTokenRef.current.cancelled = true;
        isPlayingRef.current = false;
        if (delayTimeoutRef.current) {
            clearTimeout(delayTimeoutRef.current);
            delayTimeoutRef.current = null;
        }
        dispatch({ type: 'STOP_ALL' });
    }, []);

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

    const playAudio = useCallback(async (text, langCode, useReadingSpeed = false, voiceName = null) => {
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
    }, [readingSpeed, availableVoices, getTTSLanguageCode]);

    const resetCancelToken = useCallback(() => {
        cancelTokenRef.current = { cancelled: false };
    }, []);

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
        const maxIndex = Math.max(0, Math.min(filteredData.length - 1, (recordsToPlay === Infinity ? filteredData.length : recordsToPlay) - 1));

        if (nextRecord > maxIndex) {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: 0 });
            dispatch({ type: 'RESET_REPEAT' });
            updateFirstElement(0);
        } else {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: nextRecord });
            dispatch({ type: 'RESET_REPEAT' });
            updateFirstElement(nextRecord);
        }
    }, [playerState.currentRecord, filteredData.length, recordsToPlay, updateFirstElement, resetCancelToken]);

    const playCurrentRecord = useCallback(async () => {
        if (isPlayingRef.current) {
            return;
        }

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

        isPlayingRef.current = true;

        const sessionToken = { cancelled: false };
        cancelTokenRef.current = sessionToken;

        dispatch({ type: 'SET_SPEAKING', payload: true });

        const currentRecordAtStart = playerState.currentRecord;
        const currentRepeatAtStart = playerState.currentRepeat;

        if (!filteredData[currentRecordAtStart]) {
            console.error('Record not found at index:', currentRecordAtStart);
            dispatch({ type: 'SET_SPEAKING', payload: false });
            dispatch({ type: 'SET_PLAYING', payload: false });
            isPlayingRef.current = false;
            return;
        }

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
                isPlayingRef.current = false;
                return;
            }

            if (tipPart) {
                // Если есть tip, читаем: tip > foreign > translation
                await playAudio(tipPart, tipLanguage, true, selectedVoiceTip);

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    isPlayingRef.current = false;
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, 100));

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    isPlayingRef.current = false;
                    return;
                }

                await playAudio(foreignPart, foreignLanguage, true, selectedVoiceForeign);

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    isPlayingRef.current = false;
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, 100));

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    isPlayingRef.current = false;
                    return;
                }

                await playAudio(translation, translationLanguage, true, selectedVoiceTranslation);

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    isPlayingRef.current = false;
                    return;
                }
            } else {
                // Если tip пуст, читаем: translation > foreign
                await playAudio(translation, translationLanguage, true, selectedVoiceTranslation);

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    isPlayingRef.current = false;
                    return;
                }

                await new Promise(resolve => setTimeout(resolve, 100));

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    isPlayingRef.current = false;
                    return;
                }

                await playAudio(foreignPart, foreignLanguage, true, selectedVoiceForeign);

                if (!shouldContinue()) {
                    dispatch({ type: 'SET_SPEAKING', payload: false });
                    isPlayingRef.current = false;
                    return;
                }
            }

            dispatch({ type: 'SET_SPEAKING', payload: false });
            isPlayingRef.current = false;

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
            isPlayingRef.current = false;

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

    const handlePlayPause = () => {
        if (playerState.isPlaying) {
            stopPlayback();
        } else {
            resetCancelToken();
            dispatch({ type: 'SET_PLAYING', payload: true });
        }
    };

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

        const maxAllowedIndex = Math.max(0, Math.min(filteredData.length - 1, (recordsToPlay === Infinity ? filteredData.length : recordsToPlay) - 1));

        const prevRecord = playerState.currentRecord - 1;
        if (prevRecord < 0) {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: maxAllowedIndex });
            updateFirstElement(maxAllowedIndex);
        } else {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: prevRecord });
            updateFirstElement(prevRecord);
        }
        dispatch({ type: 'RESET_REPEAT' });
    };

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

    useEffect(() => {
        const maxDataIndex = Math.max(0, filteredData.length - 1);
        const recordsLimit = recordsToPlay === Infinity || recordsToPlay === 'all'
            ? filteredData.length
            : Number(recordsToPlay) || filteredData.length;

        const maxAllowedIndex = Math.max(0, Math.min(maxDataIndex, recordsLimit - 1));

        const validFirstElement = typeof firstElement === 'number' && !isNaN(firstElement)
            ? firstElement
            : 0;
        const newRecord = Math.min(validFirstElement, maxAllowedIndex);

        if (newRecord !== playerState.currentRecord && !isNaN(newRecord)) {
            dispatch({ type: 'SET_CURRENT_RECORD', payload: newRecord });
        }
    }, [firstElement, filteredData.length, recordsToPlay, playerState.currentRecord]);

    useEffect(() => {
        if (playerState.isPlaying && filteredData.length > 0 &&
            !playerState.isSpeaking && !playerState.isInDelay && !isPlayingRef.current) {
            playCurrentRecord();
        } else if (filteredData.length === 0) {
            dispatch({ type: 'SET_PLAYING', payload: false });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        playerState.isPlaying,
        playerState.currentRecord,
        playerState.currentRepeat,
        playerState.isSpeaking,
        playerState.isInDelay,
        filteredData.length,
    ]);

    useEffect(() => {
        if (!playerState.isPlaying) return;

        const checkSynthesis = () => {
            if (window.speechSynthesis.speaking ||
                window.speechSynthesis.pending ||
                playerState.isSpeaking ||
                playerState.isInDelay ||
                isPlayingRef.current) {
                return;
            }

            if (playerState.isPlaying && !cancelTokenRef.current?.cancelled) {
                playCurrentRecord();
            }
        };

        const interval = setInterval(checkSynthesis, 1000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playerState.isPlaying, playerState.isSpeaking, playerState.isInDelay]);

    useEffect(() => {
        return () => {
            window.speechSynthesis.cancel();
            if (delayTimeoutRef.current) {
                clearTimeout(delayTimeoutRef.current);
            }
        };
    }, []);

    const contextValue = {
        playerState,
        dispatch,
        filteredData,
        currentEntry: filteredData[playerState.currentRecord],
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

export const usePlayerContext = () => {
    const context = useContext(PlayerContext);
    if (context === undefined) {
        throw new Error('usePlayerContext must be used within a PlayerProvider');
    }
    return context;
};