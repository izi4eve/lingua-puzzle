import React from 'react';
import { IoPlay, IoPause, IoPlayBack, IoPlayForward } from "react-icons/io5";
import { RiEdit2Fill } from "react-icons/ri";
import { ImCross } from "react-icons/im";
import { IoPlaySkipBack } from "react-icons/io5";

import EditEntryModal from './EditEntryModal';
import { usePlayerContext } from './PlayerContext';

const PlayerControls = () => {
    const {
        playerState,
        dispatch,
        filteredData,
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

    return (
        <>
            <div className="btn-group btn-group-sm w-100">
                <button type="button" className="btn btn-success rounded-start-pill" onClick={handlePlayPause}>
                    {playerState.isPlaying ? <IoPause /> : <IoPlay />}
                </button>
                {!playerState.isPlaying && (
                    <>
                        <button type="button" className="btn btn-info" onClick={handleEditClick}>
                            <RiEdit2Fill />
                        </button>
                        <button type="button" className="btn btn-primary" onClick={handleMarkAsLearned}>
                            <ImCross size={10} />
                        </button>
                        <button type="button" className="btn btn-dark" onClick={handleGoToFirst}>
                            <IoPlaySkipBack />
                        </button>
                    </>
                )}
                <button type="button" className="btn btn-danger" onClick={handlePrev}>
                    <IoPlayBack />
                </button>
                <button type="button" className="btn btn-warning rounded-end-pill" onClick={handleNext}>
                    <IoPlayForward />
                </button>
            </div>

            <div className="mt-3">
                {filteredData.length > 0 && currentEntry && (
                    <div>
                        <p className="fs-5 fw-bold">
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