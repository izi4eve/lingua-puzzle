import React, { useEffect, useRef } from "react";

const PreventScreenSleep = () => {
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
    }
  };

  useEffect(() => {
    if ("wakeLock" in navigator) {
      requestWakeLock();
    } else {
      console.warn("Wake Lock API is not supported in this browser.");
    }

    return () => {
      releaseWakeLock();
    };
  }, []);

  return <div style={{ display: "none" }}>Wake Lock Active</div>;
};

export default PreventScreenSleep;