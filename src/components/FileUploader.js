import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Title from './Title';
import { TbCircleNumber1Filled } from "react-icons/tb";

const FileUploader = ({ onDataLoaded, onTTSLanguageChange }) => {
    const { t } = useTranslation();

    const [fileList, setFileList] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('en-US');

    const languages = [
        { name: 'English', code: 'en-US' },
        { name: 'Deutsch', code: 'de-DE' },
        { name: 'Français', code: 'fr-FR' },
        { name: 'Italiano', code: 'it-IT' },
        { name: 'Español', code: 'es-ES' },
        { name: 'Português', code: 'pt-PT' },
        { name: 'Polski', code: 'pl-PL' },
        { name: 'Čeština', code: 'cs-CZ' }
    ];

    useEffect(() => {
        // Загружаем сохранённый язык озвучивания или устанавливаем язык по умолчанию
        const savedTTSLanguage = localStorage.getItem('ttsLanguage') || 'en-US';
        setSelectedLanguage(savedTTSLanguage);
        onTTSLanguageChange(savedTTSLanguage);
    }, [onTTSLanguageChange]);

    const handleTTSLanguageChange = (event) => {
        const newLanguage = event.target.value;
        setSelectedLanguage(newLanguage);
        localStorage.setItem('ttsLanguage', newLanguage); // Сохраняем выбранный язык в localStorage
        onTTSLanguageChange(newLanguage); // Передаем выбранный язык в родительский компонент
    };

    const fetchFileList = () => {
        try {
            const context = require.context('../dic', false, /\.txt$/);
            const files = context.keys().map(file => file.replace('./', '').replace('.txt', ''));
            setFileList(files);
        } catch (error) {
            console.error("File loading error: ", error);
        }
    };

    useEffect(() => {
        fetchFileList();
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                processFileContent(content);
            };
            reader.readAsText(file);
            setSelectedFile('');
        }
    };

    const processFileContent = (content) => {
        const filteredData = content
            .split('\n')
            .filter(line => line.trim().length >= 3)
            .map(line => {
                const [foreignPart, translation] = line.split('=').map(part => part.trim());
                return { foreignPart, translation, isLearned: false };
            });

        onDataLoaded(filteredData);
    };

    const handleSelectFile = (event) => {
        const selectedFileName = event.target.value;
        setSelectedFile(selectedFileName);

        if (selectedFileName) {
            const filePath = require(`../dic/${selectedFileName}.txt`);
            fetch(filePath)
                .then(response => {
                    if (!response.ok) throw new Error('File loading error');
                    return response.text();
                })
                .then(content => {
                    processFileContent(content);
                })
                .catch(error => {
                    console.error('File loading error:', error);
                });

            document.getElementById('file-input').value = '';
        }
    };

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<TbCircleNumber1Filled size={28} />} text={t('choose-dic')} />

            <div>
                <select value={selectedFile} onChange={handleSelectFile}>
                    <option value="">{t('select-dic')}</option>
                    {fileList.map((fileName, index) => (
                        <option key={index} value={fileName}>{fileName}</option>
                    ))}
                </select>
            </div>

            <div className="h6 py-1 pt-2">{t('open-txt')}</div>

            <div>
                <input
                    id="file-input"
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                />
            </div>

            <div className="h6 pt-2">
                {t('tts-lang')}: <select value={selectedLanguage} onChange={handleTTSLanguageChange}>
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default FileUploader;