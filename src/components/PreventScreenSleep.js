import { useEffect, useRef } from "react";

const PreventScreenSleep = ({ isPlaying }) => {
  const wakeLockRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      console.log("Wake Lock is active.");
      
      wakeLockRef.current.addEventListener("release", () => {
        console.log("Wake Lock has been released.");
      });
    } catch (err) {
      console.error(`Failed to acquire Wake Lock: ${err.message}`);
    }
  };

  const releaseWakeLock = () => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release();
      wakeLockRef.current = null;
      console.log("Wake Lock has been manually released.");
    }
  };

  useEffect(() => {
    if ("wakeLock" in navigator) {
      if (isPlaying) {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    } else {
      console.warn("Wake Lock API is not supported in this browser.");
    }

    // Очищаем блокировку при размонтировании
    return () => {
      releaseWakeLock();
    };
  }, [isPlaying]);

  return null; // Компонента ничего не рендерит
};

export default PreventScreenSleep;