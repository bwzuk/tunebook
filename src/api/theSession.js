const BASE_URL = 'https://thesession.org';

export async function searchTunes(query, page = 1, perPage = 20) {
  const url = `${BASE_URL}/tunes/search?q=${encodeURIComponent(query)}&format=json&page=${page}&perpage=${perPage}`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const data = await response.json();
  return {
    tunes: data.tunes || [],
    pages: data.pages || 1,
    page: data.page || 1,
    total: data.total || 0,
  };
}

export async function getTuneDetails(tuneId) {
  const url = `${BASE_URL}/tunes/${tuneId}?format=json`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch tune: ${response.status}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    url: `${BASE_URL}/tunes/${data.id}`,
    settings: (data.settings || []).map((setting) => ({
      id: setting.id,
      key: setting.key,
      abc: setting.abc,
      meter: setting.meter || getMeterFromType(data.type),
      member: setting.member?.name || 'Unknown',
    })),
  };
}

function getMeterFromType(type) {
  const meters = {
    jig: '6/8',
    reel: '4/4',
    hornpipe: '4/4',
    polka: '2/4',
    'slip jig': '9/8',
    waltz: '3/4',
    slide: '12/8',
    barndance: '4/4',
    strathspey: '4/4',
    march: '4/4',
    mazurka: '3/4',
  };
  return meters[type?.toLowerCase()] || '4/4';
}
