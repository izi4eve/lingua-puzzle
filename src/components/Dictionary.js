import React, { useState, useMemo } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { FixedSizeList } from 'react-window';

const Dictionary = ({ show, onHide, data, onDataUpdate }) => {
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

  const Row = ({ index, style }) => {
    const entry = filteredData[index];
    const originalIndex = data.indexOf(entry); // Получаем индекс в исходном массиве data
    return (
      <div
        className={`fs-7 d-flex flex-column w-100 ${entry.isLearned ? 'text-muted' : ''}`}
        style={{ ...style }}
      >
        <div className="text-bg-secondary rounded-pill px-2 d-flex justify-content-between align-items-center mb-1">
          <span className="flex-shrink-0" style={{ width: '60px' }}>#{originalIndex}</span>
          <div className="d-flex align-items-center flex-shrink-0 ms-auto">
            <span className="me-2">Знаю</span>
            <Form.Check
              type="checkbox"
              checked={entry.isLearned}
              onChange={() => handleCheckboxChange(originalIndex)} // Используем originalIndex
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
        <Modal.Title>Dictionary</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form.Group className="mb-3">
          <Form.Control
            type="text"
            placeholder="Filter (min 2 characters)"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
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
          <p>No entries found</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="btn btn-sm btn-outline-dark" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default Dictionary;