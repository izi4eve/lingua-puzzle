import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Modal, Form, Button, InputGroup } from 'react-bootstrap';
import { FixedSizeList } from 'react-window';
import { useTranslation } from 'react-i18next';
import { FaTimes } from 'react-icons/fa';

const Dictionary = ({ show, onHide, data, onDataUpdate, setFirstElement, firstElement }) => {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const listRef = useRef(null); // Ref для FixedSizeList

  // Мемоизация отфильтрованных данных
  const filteredData = useMemo(() => {
    if (!filter || filter.length < 2) return data;
    const lowerFilter = filter.toLowerCase();
    return data.filter(
      ({ foreignPart, translation, tipPart }) =>
        (foreignPart?.toLowerCase() || '').includes(lowerFilter) ||
        (translation?.toLowerCase() || '').includes(lowerFilter) ||
        (tipPart?.toLowerCase() || '').includes(lowerFilter)
    );
  }, [data, filter]);

  // Вычисление индекса для прокрутки при открытии модального окна
  const initialScrollIndex = useMemo(() => {
    if (!data.length || filter.length >= 2) return 0; // При фильтре или пустом data возвращаем 0

    // Находим originalIndex для firstElement
    let nonLearnedCount = 0;
    let targetOriginalIndex = 0;

    for (let i = 0; i < data.length; i++) {
      if (!data[i].isLearned) {
        if (nonLearnedCount === firstElement) {
          targetOriginalIndex = i;
          break;
        }
        nonLearnedCount++;
      }
    }

    // Находим индекс этой записи в filteredData
    const targetEntry = data[targetOriginalIndex];
    const indexInFiltered = filteredData.indexOf(targetEntry);
    return indexInFiltered >= 0 ? indexInFiltered : 0;
  }, [data, firstElement, filteredData, filter]);

  // Прокрутка при открытии модального окна
  useEffect(() => {
    if (show && listRef.current) {
      const scrollIndex = filter.length >= 2 ? 0 : initialScrollIndex;
      console.log('Modal opened, scrolling to:', scrollIndex, 'filter:', filter, 'filteredData.length:', filteredData.length);
      // Откладываем прокрутку, чтобы перезаписать поведение FixedSizeList
      requestAnimationFrame(() => {
        listRef.current.scrollToItem(scrollIndex, 'start');
      });
    }
  }, [show, initialScrollIndex, filter, filteredData.length]);

  // Прокрутка при изменении фильтра
  useEffect(() => {
    if (show && listRef.current && filter.length >= 2) {
      console.log('Filter applied, scrolling to 0, filter:', filter, 'filteredData.length:', filteredData.length);
      // Откладываем прокрутку, чтобы перезаписать поведение FixedSizeList
      requestAnimationFrame(() => {
        listRef.current.scrollToItem(0, 'start');
      });
    }
  }, [show, filter, filteredData.length]);

  const handleCheckboxChange = (index) => {
    const currentFirstElement = firstElement; // Сохраняем firstElement
    const updatedData = [...data];
    updatedData[index].isLearned = !updatedData[index].isLearned;
    localStorage.setItem('data', JSON.stringify(updatedData));
    onDataUpdate(updatedData);
    setFirstElement(currentFirstElement); // Восстанавливаем firstElement
  };

  const handleWordClick = (originalIndex) => {
    const learnedCountBefore = data.slice(0, originalIndex).filter(item => item.isLearned).length;
    const newFirstElement = originalIndex - learnedCountBefore;
    setFirstElement(newFirstElement);
    onHide();
  };

  const handleClearFilter = () => {
    setFilter('');
  };

  const Row = ({ index, style }) => {
    const entry = filteredData[index];
    const originalIndex = data.indexOf(entry);
    return (
      <div
        className={`fs-7 d-flex flex-column w-100 ${entry.isLearned ? 'text-muted' : ''}`}
        style={{ ...style }}
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
        <div
          className="w-100 text-break"
          onClick={() => handleWordClick(originalIndex)}
        >
          {`${entry.foreignPart} = ${entry.translation} = ${entry.tipPart}`}
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
              ref={listRef}
              height={400}
              width="100%"
              itemCount={filteredData.length}
              itemSize={100}
              key={filter} // Сбрасываем состояние FixedSizeList при изменении фильтра
              onItemsRendered={({ visibleStartIndex }) => {
                console.log('List rendered, visibleStartIndex:', visibleStartIndex, 'filter:', filter, 'filteredData.length:', filteredData.length);
              }}
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