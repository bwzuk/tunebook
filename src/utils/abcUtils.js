/**
 * Extract the first N bars from an ABC string
 * @param {string} abc - Full ABC notation
 * @param {number} barCount - Number of bars to extract (default 8)
 * @returns {string} - ABC with only the first N bars
 */
export function extractFirstBars(abc, barCount = 8) {
  if (!abc) return '';

  const lines = abc.split('\n');
  const headerLines = [];
  const bodyLines = [];

  // Separate headers from body
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Header lines start with single letter followed by colon
    if (/^[A-Za-z]:/.test(trimmed) && bodyLines.length === 0) {
      headerLines.push(trimmed);
    } else {
      bodyLines.push(trimmed);
    }
  }

  // Join body and count bars
  const body = bodyLines.join(' ');

  // Count bar lines (| or |] or || or |:, etc.)
  // We want to keep barCount measures
  let barsSeen = 0;
  let cutIndex = body.length;

  for (let i = 0; i < body.length; i++) {
    if (body[i] === '|') {
      // Skip special bar endings like |] |: || :|
      if (body[i + 1] === ']' || body[i + 1] === ':' || body[i + 1] === '|') {
        // Don't count these as bar starts
        if (body[i + 1] === '|' || body[i + 1] === ':') {
          i++; // Skip the next character too
        }
      }
      barsSeen++;
      if (barsSeen >= barCount) {
        cutIndex = i + 1;
        break;
      }
    }
  }

  const truncatedBody = body.substring(0, cutIndex).trim();

  // Ensure proper ending
  let finalBody = truncatedBody;
  if (!finalBody.endsWith('|]') && !finalBody.endsWith('||')) {
    if (finalBody.endsWith('|')) {
      finalBody = finalBody.slice(0, -1) + '|]';
    } else {
      finalBody += ' |]';
    }
  }

  return [...headerLines, finalBody].join('\n');
}

/**
 * Normalize ABC for consistent rendering
 * @param {string} abc - ABC notation
 * @returns {string} - Normalized ABC
 */
export function normalizeAbc(abc) {
  if (!abc) return '';

  // Ensure there's a proper header
  let normalized = abc.trim();

  // Add X: if missing
  if (!normalized.includes('X:')) {
    normalized = 'X:1\n' + normalized;
  }

  return normalized;
}

/**
 * Build complete ABC string with tune metadata
 * @param {object} tune - Tune object with name, key, meter, abc
 * @returns {string} - Complete ABC notation
 */
export function buildFullAbc(tune) {
  const { name, key, meter, abc } = tune;

  // Check if abc already has proper headers
  if (abc.includes('X:') && abc.includes('T:') && abc.includes('K:')) {
    return abc;
  }

  const headers = [
    'X:1',
    `T:${name || 'Untitled'}`,
    `M:${meter || '4/4'}`,
    `K:${key || 'G'}`,
  ];

  // Extract just the notes part from abc
  const lines = abc.split('\n');
  const bodyLines = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed && !/^[XTMKLQCRS]:/.test(trimmed);
  });

  return [...headers, ...bodyLines].join('\n');
}
