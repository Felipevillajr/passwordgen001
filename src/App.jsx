// App.jsx
/**
 * Minimalist React Password Generator (React 18+)
 *
 * Run:
 * 1) Create a fresh React app (Vite or CRA)
 * 2) Replace src/App.jsx (or App.js) with this file
 * 3) Create src/App.css with the CSS block below
 * 4) Ensure App imports "./App.css", then run `npm run dev` (Vite) or `npm start` (CRA)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import "./App.css";

const LENGTH_OPTIONS = [6, 8, 10, 12, 16];

const CHARSETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: `!@#$%^&*()_+-=[]{}|;':",.<>?/~\``,
};

/** Secure random integer in [0, max) with Math.random fallback. */
function getRandomInt(max) {
  if (max <= 0) return 0;

  if (typeof window !== "undefined" && window.crypto?.getRandomValues) {
    const maxUint32 = 0xffffffff;
    const limit = maxUint32 - ((maxUint32 + 1) % max);
    const randomArray = new Uint32Array(1);
    let randomValue = 0;

    do {
      window.crypto.getRandomValues(randomArray);
      randomValue = randomArray[0];
    } while (randomValue > limit);

    return randomValue % max;
  }

  return Math.floor(Math.random() * max);
}

function App() {
  const [length, setLength] = useState(12);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: false,
  });

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  /** Generate password from selected sets; guarantees at least one char from each selected set. */
  const generatePassword = useCallback(() => {
    const activeSets = Object.entries(options)
      .filter(([, enabled]) => enabled)
      .map(([key]) => CHARSETS[key]);

    if (activeSets.length === 0) {
      setPassword("");
      setError("Select at least one character type.");
      return;
    }

    const allChars = activeSets.join("");
    const chars = [];

    // Seed with one character per selected set.
    for (const set of activeSets) {
      chars.push(set[getRandomInt(set.length)]);
    }

    // Fill remaining length from the complete selected pool.
    while (chars.length < length) {
      chars.push(allChars[getRandomInt(allChars.length)]);
    }

    // Fisher-Yates shuffle for better distribution of seeded chars.
    for (let i = chars.length - 1; i > 0; i -= 1) {
      const j = getRandomInt(i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    setPassword(chars.slice(0, length).join(""));
    setError("");
  }, [length, options]);

  /** Auto-regenerate whenever controls change and on initial mount. */
  useEffect(() => {
    generatePassword();
  }, [generatePassword]);

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleOptionChange = (event) => {
    const { name, checked } = event.target;
    setOptions((prev) => ({ ...prev, [name]: checked }));
  };

  /** Copy password and show 2-second feedback; handle clipboard failures gracefully. */
  const handleCopy = async () => {
    if (!password) return;

    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);

      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed. Please copy manually.");
    }
  };

  const noTypesSelected = !Object.values(options).some(Boolean);

  return (
    <main className="page">
      <section className="card" aria-label="Random password generator">
        <h1 className="title">Password Generator</h1>

        <div className="passwordRow">
          <input
            className="passwordDisplay"
            type="text"
            value={password}
            readOnly
            aria-label="Generated password"
            placeholder="Your password will appear here"
          />
          <button
            type="button"
            className="copyButton"
            onClick={handleCopy}
            disabled={!password}
            aria-label="Copy password to clipboard"
          >
            Copy
          </button>
        </div>

        {copied && (
          <p className="feedback" role="status" aria-live="polite">
            Copied!
          </p>
        )}

        <div className="controls">
          <label className="fieldLabel" htmlFor="length-select">
            Password length
          </label>
          <select
            id="length-select"
            value={length}
            onChange={(e) => setLength(Number(e.target.value))}
            className="select"
            aria-label="Select password length"
          >
            {LENGTH_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size} characters
              </option>
            ))}
          </select>

          <fieldset className="checkboxGroup">
            <legend className="fieldLabel">Character types</legend>

            <label className="checkboxItem">
              <input
                type="checkbox"
                name="uppercase"
                checked={options.uppercase}
                onChange={handleOptionChange}
              />
              Include uppercase (A-Z)
            </label>

            <label className="checkboxItem">
              <input
                type="checkbox"
                name="lowercase"
                checked={options.lowercase}
                onChange={handleOptionChange}
              />
              Include lowercase (a-z)
            </label>

            <label className="checkboxItem">
              <input
                type="checkbox"
                name="numbers"
                checked={options.numbers}
                onChange={handleOptionChange}
              />
              Include numbers (0-9)
            </label>

            <label className="checkboxItem">
              <input
                type="checkbox"
                name="symbols"
                checked={options.symbols}
                onChange={handleOptionChange}
              />
              Include symbols
            </label>
          </fieldset>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button
            type="button"
            className="generateButton"
            onClick={generatePassword}
            disabled={noTypesSelected}
            aria-label="Generate password"
          >
            Generate Password
          </button>
        </div>
      </section>
    </main>
  );
}

export default App;