import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const App = () => {
  const [inputText, setInputText] = useState('');
  const [key, setKey] = useState('');
  const [mode, setMode] = useState('encrypt');
  const [grid, setGrid] = useState([]);
  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [result, setResult] = useState('');
  const [processing, setProcessing] = useState(false);

  // ---------- FIXED: Generate grid according to spec ----------
  // Step 1: insert unique letters from secret key (uppercase, alphabetic only)
  // Step 2: fill remaining slots with the alternating pattern:
  //         1 number (0..9, skipping used) -> 2 letters (A..Z, skipping used) -> repeat
  const generateGrid = (key) => {
    const used = new Set();
    const grid = Array.from({ length: 6 }, () => Array(6).fill(''));
    let row = 0, col = 0;

    // Step 1: Insert unique alphabetic characters from key
    for (const ch of key.toUpperCase()) {
      if (/[A-Z]/.test(ch) && !used.has(ch)) {
        grid[row][col] = ch;
        used.add(ch);
        col++;
        if (col === 6) { col = 0; row++; }
        if (row === 6) break;
      }
    }

    // Step 2: Fill remaining positions using pattern: 1 number -> 2 letters -> repeat
    let nextNum = 0;              // next digit to try (0..9)
    let nextLetterCode = 65;      // 'A' char code
    let state = 'num';            // 'num' -> place one digit, 'l1' -> first letter, 'l2' -> second letter

    while (row < 6) {
      if (state === 'num') {
        // Find next available single-digit number (0..9) not used
        let foundNum = null;
        for (let d = nextNum; d <= 9; d++) {
          const s = String(d);
          if (!used.has(s)) {
            foundNum = s;
            nextNum = d + 1; // next search starts after the used digit
            break;
          }
        }

        if (foundNum === null) {
          // No digits left (all 0..9 used) -> switch to letters
          state = 'l1';
          continue;
        }

        grid[row][col] = foundNum;
        used.add(foundNum);
        col++; if (col === 6) { col = 0; row++; if (row === 6) break; }
        state = 'l1';
      } else {
        // Place letter (either first or second)
        let foundLetter = null;
        for (let c = nextLetterCode; c <= 90; c++) { // 90 = 'Z'
          const s = String.fromCharCode(c);
          if (!used.has(s)) {
            foundLetter = s;
            nextLetterCode = c + 1;
            break;
          }
        }

        if (foundLetter === null) {
          // No letters left -> switch to digits
          state = 'num';
          continue;
        }

        grid[row][col] = foundLetter;
        used.add(foundLetter);
        col++; if (col === 6) { col = 0; row++; if (row === 6) break; }

        if (state === 'l1') state = 'l2'; else state = 'num';
      }
    }

    return grid;
  };
  // -----------------------------------------------------------

  const findPosition = (char, grid) => {
    for (let i = 0; i < 6; i++)
      for (let j = 0; j < 6; j++)
        if (grid[i][j] === char) return { row: i, col: j };
    return null;
  };

  const processDigraph = (c1, c2, grid, isEncrypt) => {
    const pos1 = findPosition(c1, grid);
    const pos2 = findPosition(c2, grid);
    if (!pos1 || !pos2) return { result: c1 + c2, rule: 'Character not in grid' };
    let newPos1 = { ...pos1 }, newPos2 = { ...pos2 }, rule = '';

    // Encryption rules (as specified):
    // Same row: shift both 2 positions LEFT (encrypt) -> so -2 cols when encrypt
    // Same column: shift both 2 positions UP (encrypt) -> so -2 rows when encrypt
    // Rectangle: swap columns

    if (pos1.row === pos2.row) {
      if (isEncrypt) {
        newPos1.col = (pos1.col - 2 + 6) % 6;
        newPos2.col = (pos2.col - 2 + 6) % 6;
        rule = 'Same row: shift left by 2 (encrypt)';
      } else {
        // Decrypt: shift RIGHT by 2
        newPos1.col = (pos1.col + 2) % 6;
        newPos2.col = (pos2.col + 2) % 6;
        rule = 'Same row: shift right by 2 (decrypt)';
      }
    } else if (pos1.col === pos2.col) {
      if (isEncrypt) {
        newPos1.row = (pos1.row - 2 + 6) % 6;
        newPos2.row = (pos2.row - 2 + 6) % 6;
        rule = 'Same column: shift up by 2 (encrypt)';
      } else {
        newPos1.row = (pos1.row + 2) % 6;
        newPos2.row = (pos2.row + 2) % 6;
        rule = 'Same column: shift down by 2 (decrypt)';
      }
    } else {
      // Rectangle
      newPos1.col = pos2.col;
      newPos2.col = pos1.col;
      rule = 'Rectangle: swap columns';
    }

    return {
      result: grid[newPos1.row][newPos1.col] + grid[newPos2.row][newPos2.col],
      rule,
      positions: { original: [pos1, pos2], new: [newPos1, newPos2] }
    };
  };

  const prepareText = (text) => {
    let t = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const digraphs = [];
    let i = 0;
    while (i < t.length) {
      if (i === t.length - 1) {
        digraphs.push(t[i] + 'X');
        i++;
      } else if (t[i] === t[i + 1]) {
        digraphs.push(t[i] + 'X');
        i++;
      } else {
        digraphs.push(t[i] + t[i + 1]);
        i += 2;
      }
    }
    return digraphs;
  };

  const cleanDecryptedText = (text) => {
    let res = '';
    for (let i = 0; i < text.length; i++) {
      if (text[i] === 'X') {
        if (i > 0 && i < text.length - 1 && text[i - 1] === text[i + 1]) continue;
        if (i === text.length - 1) continue;
      }
      res += text[i];
    }
    return res;
  };

  const processText = async () => {
    if (!key || !inputText) return;
    setProcessing(true); setSteps([]); setCurrentStep(-1); setResult('');
    const newGrid = generateGrid(key); setGrid(newGrid);
    const isEncrypt = mode === 'encrypt';
    const digraphs = prepareText(inputText);
    const stepResults = [];
    let finalResult = '';

    for (let i = 0; i < digraphs.length; i++) {
      const digraph = digraphs[i];
      const processed = processDigraph(digraph[0], digraph[1], newGrid, isEncrypt);
      stepResults.push({ step: i + 1, original: digraph, processed: processed.result, rule: processed.rule, positions: processed.positions });
      finalResult += processed.result;
      await new Promise(r => setTimeout(r, 300));
      setSteps([...stepResults]); setCurrentStep(i);
    }
    if (!isEncrypt) finalResult = cleanDecryptedText(finalResult);
    setResult(finalResult); setProcessing(false);
  };

  useEffect(() => { if (key) setGrid(generateGrid(key)); else setGrid([]); }, [key]);

  return (
    <div className="container-fluid p-4" style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#667eea,#764ba2)' }}>
      <div className="container">
        <h1 className="text-center text-white mb-4">Alphanumeric Square Cipher</h1>

        {/* How It Works Section */}
        <div className="card mb-4 shadow">
          <div className="card-body">
            <h5 className="card-title">How It Works</h5>
            <p className="card-text">
              1. Create a 6x6 grid containing the letters A-Z and digits 0-9. Start by filling the grid with the secret key (unique letters only), then fill remaining characters using the 1-number → 2-letters alternating pattern.<br />
              2. Divide the plaintext into digrams (pairs of characters). If two characters are identical, insert an 'X' between them; if odd-length, append 'X'.<br />
              3. Apply encryption/decryption rules:
              <ul>
                <li><strong>Same row:</strong> shift left (encrypt) or right (decrypt) by 2 positions.</li>
                <li><strong>Same column:</strong> shift up (encrypt) or down (decrypt) by 2 positions.</li>
                <li><strong>Rectangle:</strong> swap the columns of the two characters.</li>
              </ul>
              4. Remove filler X's after decryption where appropriate.
            </p>
          </div>
        </div>

        <div className="row gx-4 gy-4">
          {/* Input Section */}
          <div className="col-12 col-lg-6">
            <div className="card shadow p-3 h-100">
              <div className="mb-3">
                <label className="form-label">Secret Key</label>
                <input className="form-control" value={key} onChange={e => setKey(e.target.value.replace(/[^A-Z0-9]/gi, ''))} placeholder="Enter key" />
              </div>
              <div className="mb-3">
                <label className="form-label">{mode === 'encrypt' ? 'Plaintext' : 'Ciphertext'}</label>
                <textarea className="form-control" value={inputText} onChange={e => setInputText(e.target.value)} rows={3} placeholder={mode === 'encrypt' ? 'Enter plaintext' : 'Enter ciphertext'} />
              </div>
              <div className="d-flex mb-3">
                <button className={`btn me-2 flex-fill ${mode === 'encrypt' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setMode('encrypt')}>Encrypt</button>
                <button className={`btn flex-fill ${mode === 'decrypt' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setMode('decrypt')}>Decrypt</button>
              </div>
              <button className="btn btn-success w-100" disabled={!key || !inputText || processing} onClick={processText}>{processing ? 'Processing...' : 'Process Text'}</button>
            </div>
          </div>

          {/* Grid & Results */}
          <div className="col-12 col-lg-6 d-flex flex-column gap-3">
            {grid.length > 0 && (
              <div className="card shadow p-3 overflow-auto">
                <h5>6x6 Cipher Grid</h5>
                <div className="d-grid gap-2" style={{ gridTemplateColumns: 'repeat(6,1fr)', display: 'grid' }}>
                  {grid.map((row, r) => row.map((cell, c) => (
                    <div key={`${r}-${c}`} className={`border rounded text-center p-2 fw-bold ${steps[currentStep]?.positions?.original?.some(p => p.row === r && p.col === c) ? 'bg-warning' : steps[currentStep]?.positions?.new?.some(p => p.row === r && p.col === c) ? 'bg-success text-white' : 'bg-light'}`}>
                      {cell}
                    </div>
                  )))}
                </div>
              </div>
            )}

            {steps.length > 0 && (
              <div className="card shadow p-3 overflow-auto" style={{ maxHeight: '300px' }}>
                <h5>Step-by-Step Process</h5>
                {steps.map((s, i) => (
                  <div key={i} className={`border rounded p-2 mb-2 ${i === currentStep ? 'border-primary' : 'border-secondary'}`}>
                    <div><strong>Step {s.step}</strong></div>
                    <div>Input: {s.original}</div>
                    <div>Output: {s.processed}</div>
                    <div className="text-muted">{s.rule}</div>
                  </div>
                ))}
              </div>
            )}

            {result && (
              <div className="card shadow p-3">
                <h5>{mode === 'encrypt' ? 'Encrypted' : 'Decrypted'} Result</h5>
                <pre className="bg-light p-2 rounded">{result}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
