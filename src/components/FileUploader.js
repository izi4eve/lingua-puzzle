import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Title from './Title';
import { TbCircleNumber1Filled } from "react-icons/tb";

const FileUploader = ({ onDataLoaded, onTTSLanguageChange, data, ttsLanguage, languages }) => {
    const { t } = useTranslation();

    const [fileList, setFileList] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');

    useEffect(() => {
        // Загружаем сохранённый язык озвучивания или устанавливаем язык по умолчанию
        const savedTTSLanguage = localStorage.getItem('ttsLanguage') || 'en-US';
        onTTSLanguageChange(savedTTSLanguage);
    }, [onTTSLanguageChange]);

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
                const isLearned = line.trim().endsWith('='); // Проверяем, есть ли '=' в конце строки
                return { foreignPart, translation, isLearned };
            });

        onDataLoaded(filteredData);
    };

    const exportDictionary = () => {
        const data = JSON.parse(localStorage.getItem('data')) || [];

        const content = data.map(({ foreignPart, translation, isLearned }) => {
            return `${foreignPart} = ${translation}${isLearned ? ' =' : ''}`;
        }).join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'dictionary.txt';
        link.click();
        URL.revokeObjectURL(url);
    };

    const resetDictionary = () => {
        const resetData = data.map((entry) => ({ ...entry, isLearned: false }));
        localStorage.setItem('data', JSON.stringify(resetData));
        localStorage.setItem('firstElement', JSON.stringify(0));
        onDataLoaded(resetData);  // Обновляем data в родительском компоненте
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
                {t('tts-lang')}:
                <select value={ttsLanguage} onChange={(e) => onTTSLanguageChange(e.target.value)}>
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </select>
            </div>

            <div className="pt-2">
                {data.length > 0 && (
                    <div>
                        <button className="btn btn-sm btn-outline-dark me-2 mb-2" onClick={resetDictionary}>
                            {t('reset-dic')}
                        </button>
                        <button className="btn btn-sm btn-dark mb-2" onClick={exportDictionary}>
                            {t('download-dic')}
                        </button>
                    </div>
                )}
            </div>

        </div>
    );
};

export default FileUploader;