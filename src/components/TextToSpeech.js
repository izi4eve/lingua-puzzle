import React from 'react';
import { HiMiniSpeakerWave } from "react-icons/hi2";

const TextToSpeech = ({ text, language = 'en-EN', rate = 0.5, volume = 1 }) => {
    const speak = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language;    // Устанавливаем язык
            utterance.rate = rate;        // Скорость чтения (1 = нормальная скорость)
            utterance.volume = volume;    // Громкость (от 0 до 1)
            // console.log(`Speaking text: "${text}" in language: "${language}"`);
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Your browser does not support text reading");
        }
    };

    return (
        <div>
            <HiMiniSpeakerWave 
                size={22} 
                onClick={speak} 
                style={{ cursor: 'pointer' }}
            />
        </div>
    );
};

export default TextToSpeech;