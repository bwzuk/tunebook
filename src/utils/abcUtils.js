/**
 * Extract the first N bars from an ABC string
 * @param {string} abc - Full ABC notation
 * @param {number} barCount - Number of bars to extract (default 8)
 * @returns {string} - ABC with only the first N bars
 */
export function extractFirstBars(abc, barCount = 8) {
  if (!abc) return '';

  // First, normalize the ABC
  const normalizedAbc = normalizeAbc(abc);

  const lines = normalizedAbc.split('\n');
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

  // Count bar lines - we want barCount complete measures
  let barsSeen = 0;
  let cutIndex = body.length;

  for (let i = 0; i < body.length; i++) {
    if (body[i] === '|') {
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
 * Normalize ABC notation from thesession.org
 *
 * TheSession.org uses `!` as a line break marker. This is NOT standard ABC.
 * Simply replace all `!` with newlines.
 *
 * @param {string} abc - Raw ABC from thesession.org
 * @returns {string} - Normalized ABC
 */
function normalizeAbc(abc) {
  if (!abc) return '';

  // Replace all ! with newlines, then clean up
  let result = abc.split('!').join('\n');

  // Clean up multiple newlines and whitespace
  result = result.replace(/\n+/g, '\n');
  result = result.replace(/\n\s+/g, '\n');
  result = result.replace(/\s+\n/g, '\n');

  return result.trim();
}

/**
 * Build complete ABC string with tune metadata
 *
 * The ABC from thesession.org typically already includes M:, L:, K: headers
 * and the tune body with repeat markers. We just need to add X: and T: if missing,
 * and normalize the line break markers.
 *
 * @param {object} tune - Tune object with name, type, key, meter, abc
 * @returns {string} - Complete ABC notation
 */
export function buildFullAbc(tune) {
  const { name, abc } = tune;

  if (!abc) return '';

  // Normalize the ABC (convert ! line breaks to newlines)
  const normalizedAbc = normalizeAbc(abc);

  // Check if ABC already has an X: header - if so, it's complete
  if (normalizedAbc.startsWith('X:') || normalizedAbc.includes('\nX:')) {
    return normalizedAbc;
  }

  // Check if ABC already has any headers (M:, L:, K:, etc.)
  // The session.org ABC typically starts with headers like M:4/4
  const hasHeaders = /^[A-Z]:/m.test(normalizedAbc);

  if (hasHeaders) {
    // ABC has headers but no X: - just prepend X: and T:
    return `X:1\nT:${name || 'Untitled'}\n${normalizedAbc}`;
  }

  // ABC is just notes with no headers at all - add full headers
  // This shouldn't happen with thesession.org data but handle it anyway
  const { key, meter } = tune;
  const headers = [
    'X:1',
    `T:${name || 'Untitled'}`,
    `M:${meter || '4/4'}`,
    `L:1/8`,
    `K:${key || 'G'}`,
  ];

  return headers.join('\n') + '\n' + normalizedAbc;
}
