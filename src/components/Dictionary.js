import React, { useState, useMemo } from 'react';
import { Modal, Form, Button, InputGroup } from 'react-bootstrap';
import { FixedSizeList } from 'react-window';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa'; // Импортируем иконку крестика

const Dictionary = ({ show, onHide, data, onDataUpdate, setFirstElement }) => {
  const { t } = useTranslation();

  const [filter, setFilter] = useState('');

  const filteredData = useMemo(() => {
    if (!filter || filter.length < 2) return data;
    const lowerFilter = filter.toLowerCase();
    return data.filter(
      ({ foreignPart, translation }) =>
        (foreignPart?.toLowerCase() || '').includes(lowerFilter) ||
        (translation?.toLowerCase() || '').includes(lowerFilter)
    );
  }, [data, filter]);

  const handleCheckboxChange = (index) => {
    const updatedData = [...data];
    updatedData[index].isLearned = !updatedData[index].isLearned;
    localStorage.setItem('data', JSON.stringify(updatedData));
    onDataUpdate(updatedData);
  };

  const handleWordClick = (originalIndex) => {
    const learnedCountBefore = data.slice(0, originalIndex).filter(item => item.isLearned).length;
    const newFirstElement = originalIndex - learnedCountBefore;
    setFirstElement(newFirstElement);
    onHide();
  };

  const handleClearFilter = () => {
    setFilter(''); // Очищаем поле фильтра
  };

  const Row = ({ index, style }) => {
    const entry = filteredData[index];
    const originalIndex = data.indexOf(entry);
    return (
      <div
        className={`fs-7 d-flex flex-column w-100 ${entry.isLearned ? 'text-muted' : ''}`}
        style={{ ...style }}
        onClick={() => handleWordClick(originalIndex)}
        role="button"
        tabIndex={0}
      >
        <div className="text-bg-secondary rounded-pill px-2 d-flex justify-content-between align-items-center mb-1">
          <span className="flex-shrink-0" style={{ width: '60px' }}>#{originalIndex}</span>
          <div className="d-flex align-items-center flex-shrink-0 ms-auto">
            <span className="me-2">{t('known')}</span>
            <Form.Check
              type="checkbox"
              checked={entry.isLearned}
              onChange={(e) => {
                e.stopPropagation();
                handleCheckboxChange(originalIndex);
              }}
              className="flex-shrink-0"
              style={{ width: '20px' }}
            />
          </div>
        </div>
        <div className="w-100 text-break">
          {`${entry.foreignPart} = ${entry.translation}`}
        </div>
      </div>
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{t('dictionary')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <InputGroup>
            <Form.Control
              type="text"
              placeholder={t('search-hint')}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            {filter && (
              <Button
                variant="outline-secondary"
                onClick={handleClearFilter}
                aria-label="Clear filter"
                style={{ borderLeft: 'none' }}
              >
                <FaTimes />
              </Button>
            )}
          </InputGroup>
        </Form.Group>
        {filteredData.length > 0 ? (
          <div style={{ height: '400px', overflow: 'auto' }}>
            <FixedSizeList
              height={400}
              width="100%"
              itemCount={filteredData.length}
              itemSize={100}
            >
              {Row}
            </FixedSizeList>
          </div>
        ) : (
          <p>{t('no-entries-found')}</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="btn btn-sm btn-outline-dark" onClick={onHide}>
          {t('close')}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Dictionary;