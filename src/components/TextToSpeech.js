import React, { useState, useCallback } from 'react';
import { HiMiniSpeakerWave } from "react-icons/hi2";

const TextToSpeech = ({ 
  text, 
  language = 'en-EN', 
  rate = 0.5, 
  volume = 1,
  // Новые параметры для совместимости с DictionaryPlayer
  selectedVoice,
  readingSpeed,
  availableVoices = [],
  ttsLanguages = []
}) => {
  const [isPlaying, setIsPlaying] = useState(false);

  // Функция для получения TTS кода языка
  const getTTSLanguageCode = useCallback((langCode) => {
    if (ttsLanguages && ttsLanguages.length > 0) {
      const ttsLang = ttsLanguages.find(lang => lang.code.startsWith(langCode));
      return ttsLang ? ttsLang.code : `${langCode}-${langCode.toUpperCase()}`;
    }
    return language;
  }, [ttsLanguages, language]);

  const speak = useCallback(() => {
    if (!text || isPlaying) return;

    if ('speechSynthesis' in window) {
      // Останавливаем текущее воспроизведение
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Устанавливаем язык - используем новую логику если переданы ttsLanguages
      if (ttsLanguages && ttsLanguages.length > 0) {
        utterance.lang = getTTSLanguageCode(language.split('-')[0]);
      } else {
        utterance.lang = language;
      }
      
      // Устанавливаем скорость - приоритет readingSpeed из DictionaryPlayer
      utterance.rate = readingSpeed !== undefined ? readingSpeed : rate;
      
      // Устанавливаем громкость
      utterance.volume = volume;
      
      // Устанавливаем голос, если выбран
      if (selectedVoice && availableVoices && availableVoices.length > 0) {
        const voice = availableVoices.find(v => v.name === selectedVoice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.onstart = () => setIsPlaying(true);
      utterance.onend = () => setIsPlaying(false);
      utterance.onerror = () => setIsPlaying(false);

      // console.log(`Speaking text: "${text}" in language: "${utterance.lang}" with rate: ${utterance.rate}`);
      window.speechSynthesis.speak(utterance);
    } else {
      alert("Your browser does not support text reading");
    }
  }, [text, language, rate, volume, selectedVoice, readingSpeed, availableVoices, getTTSLanguageCode, isPlaying, ttsLanguages]);

  return (
    <div>
      <HiMiniSpeakerWave 
        size={22} 
        onClick={speak} 
        style={{ 
          cursor: 'pointer',
          color: isPlaying ? '#0d6efd' : 'inherit'
        }}
      />
    </div>
  );
};

export default TextToSpeech;