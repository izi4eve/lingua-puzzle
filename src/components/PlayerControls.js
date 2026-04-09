import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { FaArrowRight } from 'react-icons/fa';
import { IoPlay, IoPause, IoPlayBack, IoPlayForward } from "react-icons/io5";
import { RiEdit2Fill } from "react-icons/ri";
import { ImCross } from "react-icons/im";
import { IoPlaySkipBack, IoVolumeHigh } from "react-icons/io5";

import EditEntryModal from './EditEntryModal';
import PreventScreenSleep from './PreventScreenSleep';
import { usePlayerContext } from './PlayerContext';

const PlayerControls = () => {
    const { t } = useTranslation();

    const {
        playerState,
        dispatch,
        filteredData,
        currentEntry,
        handlePlayPause,
        handleToggleReadSingle,
        handleNext,
        handlePrev,
        handleGoToFirst,
        handleMarkAsLearned,
        handleEditClick,
        handleEditSave,
        handleEditDelete,
    } = usePlayerContext();

    const isFirstRender = useRef(true);
    const typingInputRef = useRef(null);

    // ── Typing drill ────────────────────────────────────────────────────────
    const [typingValue, setTypingValue] = useState('');
    const [typingHasError, setTypingHasError] = useState(false);

    // Строка-эталон для текущей записи
    const getTargetString = useCallback(() => {
        if (!currentEntry) return '';
        const parts = [currentEntry.foreignPart, currentEntry.translation];
        if (currentEntry.tipPart) parts.push(currentEntry.tipPart);
        return parts.join(' = ');
    }, [currentEntry]);

    // Сброс поля при смене записи
    useEffect(() => {
        setTypingValue('');
        setTypingHasError(false);
        // Небольшая задержка, чтобы DOM успел обновиться
        setTimeout(() => typingInputRef.current?.focus(), 50);
    }, [currentEntry]);

    const handleTypingChange = (e) => {
        const value = e.target.value;
        const target = getTargetString();
        // Проверяем только введённую часть — ошибка если хоть один символ не совпадает
        const hasError = value.split('').some((char, i) => char !== target[i]);
        setTypingValue(value);
        setTypingHasError(hasError);
    };

    const handleTypingSubmit = () => {
        handleToggleReadSingle(); // Читаем текущую запись
        handleNext();             // Переход к следующей (currentEntry сменится → useEffect сбросит поле)
    };

    const handleTypingKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleTypingSubmit();
        }
    };
    // ────────────────────────────────────────────────────────────────────────

    // Автоматическая постановка на паузу при монтировании компонента
    useEffect(() => {
        if (isFirstRender.current && playerState.isPlaying) {
            // Останавливаем воспроизведение при создании нового экземпляра
            dispatch({ type: 'SET_PLAYING', payload: false });
            // Также можно вызвать полную остановку
            window.speechSynthesis.cancel();
        }
        isFirstRender.current = false;
    }, [playerState.isPlaying, dispatch]);

    // Обёртки для кнопок с автоматической паузой
    const handleEditClickWithPause = () => {
        if (playerState.isPlaying) {
            handlePlayPause(); // Ставим на паузу
        }
        handleEditClick();
    };

    const handleMarkAsLearnedWithPause = () => {
        if (playerState.isPlaying) {
            handlePlayPause(); // Ставим на паузу
        }
        handleMarkAsLearned();
    };

    const handleGoToFirstWithPause = () => {
        if (playerState.isPlaying) {
            handlePlayPause(); // Ставим на паузу
        }
        handleGoToFirst();
    };

    const handlePrevWithPause = () => {
        if (playerState.isPlaying) {
            handlePlayPause(); // Ставим на паузу
        }
        handlePrev();
    };

    const handleNextWithPause = () => {
        if (playerState.isPlaying) {
            handlePlayPause(); // Ставим на паузу
        }
        handleNext();
    };

    return (
        <>
            <PreventScreenSleep isPlaying={playerState.isPlaying} />

            <div className="btn-group btn-group-sm w-100">
                <button type="button" className="btn btn-success rounded-start-pill" onClick={handlePlayPause}>
                    {playerState.isPlaying ? <IoPause /> : <IoPlay />}
                </button>
                {!playerState.isPlaying && (
                    <>
                        <button
                            type="button"
                            className={`btn ${playerState.isReadingSingle ? 'btn-danger' : 'btn-secondary'}`}
                            onClick={handleToggleReadSingle}
                        >
                            <IoVolumeHigh />
                        </button>
                        <button type="button" className="btn btn-info" onClick={handleEditClickWithPause}>
                            <RiEdit2Fill />
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleMarkAsLearnedWithPause}>
                            <ImCross size={10} />
                        </button>
                        <button type="button" className="btn btn-dark" onClick={handleGoToFirstWithPause}>
                            <IoPlaySkipBack />
                        </button>
                    </>
                )}
                <button type="button" className="btn btn-danger" onClick={handlePrevWithPause}>
                    <IoPlayBack />
                </button>
                <button type="button" className="btn btn-warning rounded-end-pill" onClick={handleNextWithPause}>
                    <IoPlayForward />
                </button>
            </div>

            <div className="mt-2 lh-sm text-center w-100">
                {filteredData.length > 0 && currentEntry && (
                    <div>
                        <p className="fs-6 fw-bold pt-1">
                            <span className="text-success">{currentEntry.foreignPart}</span>
                            <span> = </span>
                            <span>{currentEntry.translation} </span>
                            {currentEntry.tipPart && (
                                <span className="tip-part"> = {currentEntry.tipPart}</span>
                            )}
                        </p>
                    </div>
                )}
            </div>

            <div className="mt-1 px-1 w-100">
                <div className="d-flex">
                    <Form.Control
                        ref={typingInputRef}
                        type="text"
                        inputMode="text"
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        data-form-type="other"
                        data-lpignore="true"
                        value={typingValue}
                        onChange={handleTypingChange}
                        onKeyDown={handleTypingKeyDown}
                        placeholder={t('typing-drill-placeholder')}
                        className="rounded-start-pill"
                        style={{
                            color: typingHasError ? '#dc3545' : undefined,
                            borderColor: typingHasError ? '#dc3545' : undefined,
                            transition: 'color 0.15s, border-color 0.15s',
                            flex: 1,
                        }}
                    />
                    <Button
                        variant="outline-dark"
                        className="rounded-end-pill px-3"
                        onClick={handleTypingSubmit}
                        style={{ borderLeft: 'none' }}
                    >
                        <FaArrowRight />
                    </Button>
                </div>
            </div>

            <EditEntryModal
                show={playerState.showEditModal}
                onHide={() => dispatch({ type: 'SET_MODAL', payload: false })}
                entry={currentEntry}
                onSave={handleEditSave}
                onDelete={handleEditDelete}
                showDeleteButton={true}
            />
        </>
    );
};

export default PlayerControls;