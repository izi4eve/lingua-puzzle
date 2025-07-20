import { useEffect, useRef } from "react";

const PreventScreenSleep = ({ isPlaying }) => {
  const wakeLockRef = useRef(null);

  const requestWakeLock = async () => {
    try {
      if (wakeLockRef.current) {
        // Если уже есть активная блокировка, не создаем новую
        return;
      }
      
      wakeLockRef.current = await navigator.wakeLock.request("screen");
      console.log("Wake Lock is active.");
      
      wakeLockRef.current.addEventListener("release", () => {
        console.log("Wake Lock has been released.");
        wakeLockRef.current = null;
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

  // Дополнительно отслеживаем видимость страницы для восстановления wake lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isPlaying) {
        // Когда страница становится видимой и плеер играет, восстанавливаем wake lock
        requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying]);

  return null; // Компонента ничего не рендерит
};

export default PreventScreenSleep;