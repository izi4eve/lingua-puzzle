import React from 'react';

const TextToSpeech = ({ text, language = 'ru-RU', rate = 1, volume = 1 }) => {
    const speak = () => {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = language;    // Устанавливаем язык
            utterance.rate = rate;        // Скорость чтения (1 = нормальная скорость)
            utterance.volume = volume;    // Громкость (от 0 до 1)
            window.speechSynthesis.speak(utterance);
        } else {
            alert("Ваш браузер не поддерживает Web Speech API.");
        }
    };

    return (
        <div>
            <button onClick={speak}>Озвучить</button>
        </div>
    );
};

export default TextToSpeech;