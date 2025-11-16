import React, { useState } from 'react';
import type { PriceLine } from '../types';
import './PriceLineManager.css';

interface PriceLineManagerProps {
  priceLines: PriceLine[];
  onAdd: (line: Omit<PriceLine, 'id'>) => void;
  onRemove: (lineId: string) => void;
  onUpdate?: (lineId: string, updates: Partial<PriceLine>) => void;
}

const PRESET_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

export const PriceLineManager: React.FC<PriceLineManagerProps> = ({
  priceLines,
  onAdd,
  onRemove,
}) => {
  const [showForm, setShowForm] = useState(false);
  const [newPrice, setNewPrice] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrice || !newLabel) return;

    onAdd({
      price: parseFloat(newPrice),
      label: newLabel,
      color: newColor,
    });

    setNewPrice('');
    setNewLabel('');
    setNewColor(PRESET_COLORS[0]);
    setShowForm(false);
  };

  return (
    <div className="price-line-manager">
      <div className="header">
        <h3>My Price Reference Lines</h3>
        <button
          className="add-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : '+ Add Line'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="add-form">
          <div className="form-row">
            <input
              type="number"
              step="0.01"
              placeholder="Price"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Label (e.g., My Buy Price)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              required
            />
          </div>
          <div className="color-picker">
            <span>Color:</span>
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                className={`color-btn ${newColor === color ? 'selected' : ''}`}
                style={{ backgroundColor: color }}
                onClick={() => setNewColor(color)}
              />
            ))}
          </div>
          <button type="submit" className="submit-btn">
            Add Price Line
          </button>
        </form>
      )}

      <div className="lines-list">
        {priceLines.length === 0 ? (
          <p className="no-lines">No price lines added yet. Add one to track your buy prices!</p>
        ) : (
          priceLines.map((line) => (
            <div key={line.id} className="line-item">
              <div className="line-info">
                <div
                  className="color-indicator"
                  style={{ backgroundColor: line.color }}
                />
                <div className="line-details">
                  <span className="line-label">{line.label}</span>
                  <span className="line-price">${line.price.toFixed(2)}</span>
                </div>
              </div>
              <button
                className="remove-btn"
                onClick={() => onRemove(line.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
