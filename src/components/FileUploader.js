import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Title from './Title';
import { TbCircleNumber1Filled } from "react-icons/tb";
import { Button, Modal, Form } from 'react-bootstrap';
import Dictionary from './Dictionary';

const FileUploader = ({
    onDataLoaded,
    onTTSLanguageChange,
    onSelectedLanguageChange,
    data,
    firstElement,
    setFirstElement,
    ttsLanguage,
    selectedLanguage,
    languages,
}) => {
    const { t } = useTranslation();

    const [fileList, setFileList] = useState([]);
    const [selectedFile, setSelectedFile] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [newEntries, setNewEntries] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showDictionaryModal, setShowDictionaryModal] = useState(false);

    const supportedLanguages = ['en', 'de', 'fr', 'it', 'es', 'pt', 'pl', 'cs', 'uk', 'sh', 'ru', 'tr', 'ar', 'fa'];

    const openAddModal = () => setShowAddModal(true);
    const closeAddModal = () => {
        setNewEntries('');
        setShowAddModal(false);
    };

    const handleNewEntriesChange = (event) => {
        const input = event.target.value;
        setNewEntries(input);
        const lines = input.split("\n");
        let hasError = false;

        for (const line of lines) {
            if (line.trim().length === 0) continue;
            const equalitySigns = (line.match(/=/g) || []).length;
            if (equalitySigns < 1 || equalitySigns > 3) {
                hasError = true;
                break;
            }
        }

        if (hasError) {
            setErrorMessage(t('equal-sign-error'));
        } else {
            setErrorMessage('');
        }
    };

    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);
    const handleConfirmReset = () => {
        resetDictionary();
        closeModal();
    };

    useEffect(() => {
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

    const processFileContent = (content) => {
        const filteredData = content
            .split('\n')
            .filter(line => line.trim().length >= 3 && line.includes('='))
            .map(line => {
                const trimmedLine = line.trim();
                const parts = trimmedLine.split('=');
                
                if (parts.length < 2 || parts.length > 4) {
                    return null;
                }

                const foreignPart = parts[0].trim();
                const translation = parts[1].trim();
                
                let tipPart = '';
                let isLearned = false;

                if (parts.length >= 3) {
                    const thirdPart = parts[2].trim();
                    
                    if (parts.length === 3) {
                        // Если третья часть пустая, то это learned
                        if (thirdPart === '') {
                            isLearned = true;
                        } else {
                            // Если третья часть не пустая, то это tipPart
                            tipPart = thirdPart;
                        }
                    } else if (parts.length === 4) {
                        // Если есть четвертая часть
                        tipPart = thirdPart;
                        const fourthPart = parts[3].trim();
                        if (fourthPart === '') {
                            isLearned = true;
                        }
                    }
                }

                return {
                    foreignPart: foreignPart || '',
                    translation: translation || '',
                    tipPart: tipPart || '',
                    isLearned
                };
            })
            .filter(entry => entry && entry.foreignPart && entry.translation);

        onDataLoaded(filteredData);
        return filteredData;
    };

    const analyzeFileName = (fileName) => {
        const prefix = fileName.slice(0, 5).toLowerCase();
        const separators = ['-', '_', ' '];
        let sourceLang, targetLang;

        for (const sep of separators) {
            const parts = prefix.split(sep);
            if (parts.length === 2 && parts[0].length === 2 && parts[1].length === 2) {
                sourceLang = parts[0];
                targetLang = parts[1];
                break;
            }
        }

        if (
            sourceLang &&
            targetLang &&
            supportedLanguages.includes(sourceLang) &&
            supportedLanguages.includes(targetLang)
        ) {
            const ttsLang = languages.find(lang => lang.code.startsWith(sourceLang))?.code || `${sourceLang}-${sourceLang.toUpperCase()}`;
            onTTSLanguageChange(ttsLang);
            onSelectedLanguageChange(targetLang);
        }
    };

    const handleSelectFile = (event) => {
        const selectedFileName = event.target.value;
        setSelectedFile(selectedFileName);

        if (selectedFileName) {
            analyzeFileName(selectedFileName);

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

    const exportDictionary = () => {
        const data = JSON.parse(localStorage.getItem('data')) || [];
        const content = data.map(({ foreignPart, translation, tipPart, isLearned }) => {
            let line = `${foreignPart} = ${translation}`;
            
            if (tipPart && tipPart.trim() !== '') {
                line += ` = ${tipPart}`;
            }
            
            if (isLearned) {
                line += ' =';
            }
            
            return line;
        }).join('\n');
        
        const blob = new Blob([`\uFEFF${content}`], { type: 'text/plain;charset=utf-8' });
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
        onDataLoaded(resetData);
    };

    const handleSaveEntries = (toEnd = false) => {
        if (!newEntries.trim() || errorMessage) return;

        const newRecords = processFileContent(newEntries);
        const storedData = JSON.parse(localStorage.getItem('data')) || [];
        let updatedData = [...storedData];

        if (toEnd) {
            updatedData = [...storedData, ...newRecords];
        } else {
            const learnedCount = storedData.slice(0, firstElement).filter(entry => entry.isLearned).length;
            const insertIndex = firstElement + learnedCount;
            updatedData.splice(insertIndex, 0, ...newRecords);
        }

        const currentFirstElement = firstElement;
        localStorage.setItem('data', JSON.stringify(updatedData));
        onDataLoaded(updatedData);
        setFirstElement(currentFirstElement);
        closeAddModal();
    };

    const openDictionaryModal = () => setShowDictionaryModal(true);
    const closeDictionaryModal = () => setShowDictionaryModal(false);

    const handleDataUpdate = (updatedData) => {
        onDataLoaded(updatedData);
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
                <label className="form-label mt-1 me-2">{t('tts-lang')}</label>
                <Form.Select value={ttsLanguage} onChange={(e) => onTTSLanguageChange(e.target.value)} className="w-auto">
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>{lang.name}</option>
                    ))}
                </Form.Select>
            </div>

            <div className="pt-2 pb-1">
                {data.length > 0 && (
                    <div className="d-flex flex-row flex-wrap gap-2">
                        <Button variant="btn btn-sm btn-dark" onClick={openDictionaryModal}>
                            {t('dictionary')}
                        </Button>
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
                            placeholder="word = translation = tip ="
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

                <Dictionary
                    show={showDictionaryModal}
                    onHide={closeDictionaryModal}
                    data={data}
                    onDataUpdate={handleDataUpdate}
                    setFirstElement={setFirstElement}
                    firstElement={firstElement}
                />
            </div>
        </div>
    );
};

export default FileUploader;