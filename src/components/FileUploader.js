import React, { useEffect, useState } from 'react';
import Title from './Title';
import { TbCircleNumber1Filled } from "react-icons/tb";

const FileUploader = ({ onDataLoaded }) => {
    const [fileList, setFileList] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');

    // Функция для получения списка файлов из папки
    const fetchFileList = () => {
        try {
            const context = require.context('../dic', false, /\.txt$/);
            const files = context.keys().map(file => file.replace('./', '').replace('.txt', ''));
            setFileList(files);
        } catch (error) {
            console.error("File loading error: ", error);
        }
    };

    // Загружаем список файлов при монтировании компонента
    useEffect(() => {
        fetchFileList();
    }, []);

    // Обработка изменения файла через input
    const handleFileChange = (event) => {
        const file = event.target.files[0]; // Получаем выбранный файл
        if (file) {
            const reader = new FileReader(); // Создаем новый FileReader
            reader.onload = (e) => { // Когда файл прочитан
                const content = e.target.result; // Получаем содержимое файла
                processFileContent(content); // Обрабатываем содержимое
            };
            reader.readAsText(file); // Читаем файл как текст
            setSelectedFile(''); // Сбрасываем выбор в выпадающем списке
        }
    };

    // Обработка содержимого файла
    const processFileContent = (content) => {
        const filteredData = content
            .split('\n')
            .filter(line => line.trim().length >= 3)
            .map(line => {
                const [foreignPart, translation] = line.split('=').map(part => part.trim());
                return { foreignPart, translation, isLearned: false };
            });

        onDataLoaded(filteredData); // Передаем обработанные данные в родительский компонент
    };

    // Обработка выбора файла из выпадающего списка
    const handleSelectFile = (event) => {
        const selectedFileName = event.target.value; // Получаем выбранное имя файла
        setSelectedFile(selectedFileName); // Устанавливаем выбранное имя файла

        if (selectedFileName) {
            // Создаем путь к файлу
            const filePath = require(`../dic/${selectedFileName}.txt`);
            fetch(filePath)
                .then(response => {
                    if (!response.ok) throw new Error('File loading error');
                    return response.text(); // Получаем текстовое содержимое файла
                })
                .then(content => {
                    processFileContent(content); // Обрабатываем содержимое
                })
                .catch(error => {
                    console.error('File loading error:', error);
                });

            // Сбрасываем значение input
            document.getElementById('file-input').value = '';
        }
    };

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
        
            <Title icon={<TbCircleNumber1Filled size={28} />} text="For learning foreign language choose dictionary" />

            <div>
                <select value={selectedFile} onChange={handleSelectFile}>
                    <option value="">Не выбрано</option>
                    {fileList.map((fileName, index) => (
                        <option key={index} value={fileName}>{fileName}</option>
                    ))}
                </select>
            </div>

            {/* <div className="h6 py-1 pt-2">Or select your .txt file where the translation is separated by an equal sign ( = )</div> */}
            <div className="h6 py-1 pt-2">Or select your own .txt file. Separate there translation by an equal sign ( = )</div>

            <div>
                <input
                    id="file-input"
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                />
            </div>

        </div>
    );
};

export default FileUploader;