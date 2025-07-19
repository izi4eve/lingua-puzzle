import React from 'react';
import { IoPlay, IoPause, IoPlayBack, IoPlayForward, IoPlaySkipBack } from "react-icons/io5";
import { RiEdit2Fill } from "react-icons/ri";
import { ImCross } from "react-icons/im";

const PlayerControls = ({
  isPlaying,
  onPlayPause,
  onEdit,
  onMarkAsLearned,
  onGoToFirst,
  onPrev,
  onNext,
  currentRecord,
  filteredData
}) => {
  return (
    <>
      <div className="btn-group btn-group-sm w-100">
        <button 
          type="button" 
          className="btn btn-success rounded-start-pill" 
          onClick={onPlayPause}
        >
          {isPlaying ? <IoPause /> : <IoPlay />}
        </button>
        {!isPlaying && (
          <>
            <button 
              type="button" 
              className="btn btn-info" 
              onClick={onEdit}
            >
              <RiEdit2Fill />
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={onMarkAsLearned}
            >
              <ImCross size={10} />
            </button>
          </>
        )}
        <button 
          type="button" 
          className="btn btn-dark" 
          onClick={onGoToFirst}
        >
          <IoPlaySkipBack />
        </button>
        <button 
          type="button" 
          className="btn btn-danger" 
          onClick={onPrev}
        >
          <IoPlayBack />
        </button>
        <button 
          type="button" 
          className="btn btn-warning rounded-end-pill" 
          onClick={onNext}
        >
          <IoPlayForward />
        </button>
      </div>

      <div className="mt-3">
        {filteredData.length > 0 && (
          <div>
            <p className="fs-5 fw-bold">
              <span className="text-success">{`${filteredData[currentRecord]?.foreignPart}`}</span>
              <span> = </span>
              <span>{`${filteredData[currentRecord]?.translation}`} </span>
              {filteredData[currentRecord]?.tipPart && (
                <span className="tip-part"> = {filteredData[currentRecord].tipPart}</span>
              )}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default PlayerControls;