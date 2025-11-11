import React from 'react';

interface LocationSelectorProps {
  locations: string[];
  selected: string;
  onChange: (loc: string) => void;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ locations, selected, onChange }) => (
  <div className="location-selector">
    <label>Location:</label>
    <select value={selected} onChange={e => onChange(e.target.value)}>
      <option value="all">All Locations</option>
      {locations.map(loc => (
        <option key={loc} value={loc}>{loc}</option>
      ))}
    </select>
  </div>
);

export default LocationSelector; 