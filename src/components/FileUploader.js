import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Title from './Title';
import { TbCircleNumber1Filled } from "react-icons/tb";
import { Button, Modal, Form } from 'react-bootstrap';

const FileUploader = ({ onDataLoaded, onTTSLanguageChange, data, firstElement, setFirstElement, ttsLanguage, languages }) => {
    const { t } = useTranslation();

    const [fileList, setFileList] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');

    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntries, setNewEntries] = useState('');

    const openAddModal = () => setShowAddModal(true);
    const closeAddModal = () => {
        setNewEntries('');
        setShowAddModal(false);
    };

    const handleNewEntriesChange = (event) => {
        const input = event.target.value;
        setNewEntries(input);

        // Проверяем количество знаков "="
        const equalitySigns = (input.match(/=/g) || []).length;
        if (equalitySigns !== input.split("\n").length) {
            setErrorMessage(t('equal-sign-error')); // Используем локализацию ошибки
        } else {
            setErrorMessage('');
        }
    };

    const [showModal, setShowModal] = React.useState(false);
    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);
    const handleConfirmReset = () => {
        resetDictionary();
        closeModal();
    };

    const [errorMessage, setErrorMessage] = useState('');

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
        return filteredData;
    };

    const exportDictionary = () => {
        const data = JSON.parse(localStorage.getItem('data')) || [];

        const content = data.map(({ foreignPart, translation, isLearned }) => {
            return `${foreignPart} = ${translation}${isLearned ? ' =' : ''}`;
        }).join('\n');

        // Создаём Blob с указанием кодировки UTF-8
        const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'dictionary.txt';
        link.click();

        // Освобождаем URL для предотвращения утечек памяти
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

    const handleSaveEntries = (toEnd = false) => {
        if (!newEntries.trim()) return;
        if (errorMessage) return;

        const newRecords = processFileContent(newEntries);
        const storedData = JSON.parse(localStorage.getItem('data')) || [];

        let updatedData = [...storedData];

        if (toEnd) {
            // Добавляем новые записи в конец
            updatedData = [...storedData, ...newRecords];
        } else {
            // Находим индекс для вставки с учётом количества выученных слов
            const learnedCount = storedData.slice(0, firstElement).filter(entry => entry.isLearned).length;
            const insertIndex = firstElement + learnedCount;

            // Вставляем новые записи по найденному индексу
            updatedData.splice(insertIndex, 0, ...newRecords);
        }

        // Сохраняем текущее значение firstElement
        const currentFirstElement = firstElement;

        // Обновляем данные в localStorage и передаём их в родительский компонент
        localStorage.setItem('data', JSON.stringify(updatedData));
        onDataLoaded(updatedData); // Передаём обновлённые данные

        // Восстанавливаем значение firstElement
        setFirstElement(currentFirstElement);

        closeAddModal();
    };

    return (
        <div className="whiteBox rounded-4 p-3 my-3">
            <Title icon={<TbCircleNumber1Filled size={28} />} text={t('choose-dic')} />

            <div>
                <Form.Select value={selectedFile} onChange={handleSelectFile} className="mt-2 w-auto">
                    <option value="">{t('select-dic')}</option>
                    {fileList.map((fileName, index) => (
                        <option key={index} value={fileName}>{fileName}</option>
                    ))}
                </Form.Select>
            </div>

            <div>
                <p className="h6 py-1 pt-2 mb-0 mt-1">{t('open-txt')}</p>
                <p className="fst-italic text-secondary h6 py-1 lh-1 p-0 m-0 mt-1 fw-semibold">{t('example')}</p>
                <p className="fst-italic text-secondary h6 py-1 lh-1 p-0 m-0 pb-3 fw-semibold">{t('example2')}</p>
            </div>

            <div>
                <Form.Control
                    id="file-input"
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="mt-2 w-auto"
                />
            </div>

            <div className="h6 pt-2 mt-1 d-flex align-items-center">
                <label className="form-label mt-1 me-2">
                    {t('tts-lang')}
                </label>
                <Form.Select value={ttsLanguage} onChange={(e) => onTTSLanguageChange(e.target.value)} className=" w-auto">
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </Form.Select>
            </div>

            <div className="pt-2 pb-1">
                {data.length > 0 && (
                    <div className="d-flex flex-row flex-wrap gap-2">
                        <Button variant="btn btn-sm btn-dark" onClick={openAddModal}>
                            {t('add-entries')}
                        </Button>
                        <Button variant="btn btn-sm btn-dark" onClick={exportDictionary}>
                            {t('download-dic')}
                        </Button>
                        <Button variant="btn btn-sm btn-outline-dark" onClick={openModal}>
                            {t('reset-dic')}
                        </Button>
                    </div>
                )}

                <Modal show={showModal} onHide={closeModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('confirm-action')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>{t('sure')}</Modal.Body>
                    <Modal.Footer>
                        <Button variant="btn btn-sm btn-dark" onClick={closeModal}>
                            {t('cancel')}
                        </Button>
                        <Button variant="btn btn-sm btn-outline-dark" onClick={handleConfirmReset}>
                            {t('yes')}
                        </Button>
                    </Modal.Footer>
                </Modal>

                <Modal show={showAddModal} onHide={closeAddModal}>
                    <Modal.Header closeButton>
                        <Modal.Title>{t('add-entries')}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <p>{t('add-entries-instruction')}</p>
                        <Form.Control
                            as="textarea"
                            rows={5}
                            value={newEntries}
                            onChange={handleNewEntriesChange}
                            placeholder="word = translation"
                        />
                        {errorMessage && <div className="text-danger mt-2">{errorMessage}</div>}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="btn btn-sm btn-outline-dark" onClick={() => handleSaveEntries(false)}>
                            {t('save')}
                        </Button>
                        <Button variant="btn btn-sm btn-dark" onClick={() => handleSaveEntries(true)}>
                            {t('save-to-end')}
                        </Button>
                        <Button variant="btn btn-sm btn-outline-dark" onClick={closeAddModal}>
                            {t('cancel')}
                        </Button>
                    </Modal.Footer>
                </Modal>
            </div>

        </div>
    );
};

export default FileUploader;