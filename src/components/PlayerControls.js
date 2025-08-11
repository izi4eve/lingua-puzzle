import React, { useEffect, useRef } from 'react';
import { IoPlay, IoPause, IoPlayBack, IoPlayForward } from "react-icons/io5";
import { RiEdit2Fill } from "react-icons/ri";
import { ImCross } from "react-icons/im";
import { IoPlaySkipBack } from "react-icons/io5";
import EditEntryModal from './EditEntryModal';
import PreventScreenSleep from './PreventScreenSleep';
import { usePlayerContext } from './PlayerContext';

const PlayerControls = () => {
    const {
        playerState,
        dispatch,
        // filteredData, // Убираем, если не используется напрямую
        recordsToPlayData, // Используем recordsToPlayData для проверки длины
        currentEntry,
        handlePlayPause,
        handleNext,
        handlePrev,
        handleGoToFirst,
        handleMarkAsLearned,
        handleEditClick,
        handleEditSave,
        handleEditDelete,
    } = usePlayerContext();

    const isFirstRender = useRef(true);

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
                {/* Используем recordsToPlayData.length для проверки */}
                {recordsToPlayData.length > 0 && currentEntry && (
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