import React, { useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const HEADER_FONTS = [
  'Impact, Arial Black, sans-serif',
  'Arial, sans-serif',
  'Georgia, serif',
  'Trebuchet MS, sans-serif',
  'Verdana, sans-serif',
  'Courier New, monospace',
];

const K_FONTS = [
  'Impact, Haettenschweiler, Arial Black, sans-serif',
  'Arial Black, Gadget, sans-serif',
  'Courier New, monospace',
  'Georgia, serif',
  'Verdana, sans-serif',
  'Trebuchet MS, sans-serif',
];

const DEFAULT_COLORS = {
  k: '#dc2626',
  sign: '#ffffff',
  background: '#111111',
  text: '#ffffff',
  headerBackground: '#7f1d1d',
};

function ColorField({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="color-row">
        <input type="color" value={value} onChange={(event) => onChange(event.target.value)} />
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((font) => (
          <option key={font} value={font}>{font.split(',')[0]}</option>
        ))}
      </select>
    </label>
  );
}

function App() {
  const [ks, setKs] = useState(Array.from({ length: 8 }, () => 'forward'));
  const [title, setTitle] = useState("TODAY'S STRIKEOUTS");
  const [logoDataUrl, setLogoDataUrl] = useState('');
  const [colors, setColors] = useState(DEFAULT_COLORS);
  const [headerFont, setHeaderFont] = useState(HEADER_FONTS[0]);
  const [kFont, setKFont] = useState(K_FONTS[0]);
  const svgRef = useRef(null);

  const rowCount = Math.max(1, Math.ceil(ks.length / 11));
  const boardHeight = 120 + rowCount * 98;
  const svgViewHeight = Math.max(390, 240 + boardHeight);

  const setColor = (key, value) => setColors((current) => ({ ...current, [key]: value }));
  const addK = (direction) => setKs((current) => [...current, direction]);
  const removeK = () => setKs((current) => current.slice(0, -1));
  const resetKs = () => setKs(Array.from({ length: 8 }, () => 'forward'));
  const resetColors = () => setColors(DEFAULT_COLORS);
  const toggleK = (index) => setKs((current) => current.map((item, itemIndex) => itemIndex === index ? (item === 'forward' ? 'backward' : 'forward') : item));

  const handleLogoUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const downloadImage = (format) => {
    const svg = svgRef.current;
    if (!svg) return;

    const serializer = new XMLSerializer();
    const svgText = serializer.serializeToString(svg);
    const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const image = new Image();

    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 2400;
      canvas.height = Math.round(2400 * (svgViewHeight / 1200));
      const context = canvas.getContext('2d');
      if (!context) return;
      context.fillStyle = colors.background;
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(svgUrl);

      const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
      canvas.toBlob((blob) => {
        if (!blob) return;
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `strikeout-count-${ks.length}K.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      }, mimeType, 0.95);
    };

    image.onerror = () => {
      URL.revokeObjectURL(svgUrl);
      alert('The image could not be exported. Try clearing the uploaded logo and downloading again.');
    };

    image.src = svgUrl;
  };

  return (
    <main className="app">
      <section className="preview-card">
        <svg ref={svgRef} viewBox={`0 120 1200 ${svgViewHeight}`} xmlns="http://www.w3.org/2000/svg">
          <rect x="0" y="0" width="1200" height="900" fill="transparent" />
          <rect x="48" y="210" width="1104" height={boardHeight} fill={colors.background} stroke="#3f3f46" strokeWidth="8" rx="8" />
          <rect x="72" y="228" width="1056" height="42" fill={colors.headerBackground} rx="4" />
          <text x="92" y="256" fill={colors.text} fontSize="26" fontFamily={headerFont} letterSpacing="1">{title}</text>
          {logoDataUrl ? (
            <image href={logoDataUrl} x="1016" y="230" width="96" height="34" preserveAspectRatio="xMidYMid meet" />
          ) : (
            <g opacity="0.7">
              <rect x="1016" y="230" width="96" height="34" fill="none" stroke={colors.text} strokeDasharray="6 5" rx="4" />
              <text x="1064" y="251" textAnchor="middle" fill={colors.text} fontSize="13" fontFamily="Arial, sans-serif">LOGO</text>
            </g>
          )}
          <rect x="72" y="282" width="1056" height="3" fill={colors.k} />
          <g transform="translate(84 300)">
            {ks.map((dir, index) => {
              const col = index % 11;
              const row = Math.floor(index / 11);
              const x = col * 94;
              const y = row * 98;
              return (
                <g key={index} transform={`translate(${x} ${y})`}>
                  <rect x="0" y="0" width="72" height="92" fill={colors.sign} stroke="#d4d4d8" strokeWidth="1" rx="3" />
                  <text x="36" y="75" textAnchor="middle" transform={dir === 'backward' ? 'translate(72 0) scale(-1 1)' : undefined} fill={colors.k} fontSize="82" fontWeight="900" fontFamily={kFont}>K</text>
                </g>
              );
            })}
          </g>
        </svg>
      </section>

      <section className="controls-card">
        <div className="top-controls">
          <div>
            <h1>Strikeout Count Image Generator</h1>
            <p>Touch-friendly controls for creating and downloading the counter image.</p>
          </div>
          <div className="download-buttons">
            <button onClick={() => downloadImage('png')}>Download PNG</button>
            <button onClick={() => downloadImage('jpg')}>Download JPG</button>
          </div>
        </div>

        <div className="grid four">
          <label className="field wide">
            <span>Header label</span>
            <input value={title} onChange={(event) => setTitle(event.target.value)} />
          </label>
          <SelectField label="Header Font" value={headerFont} onChange={setHeaderFont} options={HEADER_FONTS} />
          <SelectField label="K Font" value={kFont} onChange={setKFont} options={K_FONTS} />
        </div>

        <div className="grid two-one">
          <div className="field">
            <span>Upload Team Logo</span>
            <div className="file-row">
              <label className="file-button">Choose File<input type="file" accept="image/*" onChange={handleLogoUpload} /></label>
              {logoDataUrl && <button className="secondary" onClick={() => setLogoDataUrl('')}>Clear Logo</button>}
            </div>
          </div>
          <div className="field">
            <span>Strikeouts: {ks.length}</span>
            <div className="k-actions">
              <button onClick={() => addK('forward')}>+ Forward K</button>
              <button onClick={() => addK('backward')}>+ Backward K</button>
              <button className="secondary" onClick={removeK}>Remove</button>
              <button className="secondary" onClick={resetKs}>Reset</button>
            </div>
          </div>
        </div>

        <div className="field">
          <span>Tap any K to flip it</span>
          <div className="k-grid">
            {ks.map((dir, index) => (
              <button key={index} onClick={() => toggleK(index)} style={{ backgroundColor: colors.sign, borderColor: colors.sign, color: colors.k, transform: dir === 'backward' ? 'scaleX(-1)' : undefined }}>K</button>
            ))}
          </div>
        </div>

        <div className="grid colors">
          <ColorField label="K" value={colors.k} onChange={(value) => setColor('k', value)} />
          <ColorField label="Sign" value={colors.sign} onChange={(value) => setColor('sign', value)} />
          <ColorField label="Background" value={colors.background} onChange={(value) => setColor('background', value)} />
          <ColorField label="Text" value={colors.text} onChange={(value) => setColor('text', value)} />
          <ColorField label="Header Background" value={colors.headerBackground} onChange={(value) => setColor('headerBackground', value)} />
        </div>

        <div className="right"><button className="secondary" onClick={resetColors}>Reset Colors</button></div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
