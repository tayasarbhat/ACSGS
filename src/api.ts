const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzJA2EyOfRkmpnUE0VF5Kfem0s3-n4g7TvFQYHMzkqy8_Ez9Xg1hwmsq9jU6uoc3kY5/exec';
const MAX_RETRIES = 2; // Reduced from 3
const RETRY_DELAY = 500; // Reduced from 1000ms to 500ms

async function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetry(url: string, options?: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await wait(RETRY_DELAY);
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

export async function fetchSheetData() {
  try {
    const response = await fetchWithRetry(GOOGLE_SCRIPT_URL);
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid data format received from API');
    }
    
    return data;
  } catch (error) {
    console.error('Failed to fetch sheet data:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch data');
  }
}

export async function updateStatus(msisdn: string, newStatus: 'Open' | 'Reserved') {
  try {
    const response = await fetchWithRetry(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({ msisdn, newStatus }),
    });
    
    const result = await response.json();
    
    if (!result || result.error) {
      throw new Error(result?.error || 'Failed to update status');
    }
    
    return result;
  } catch (error) {
    console.error('Failed to update status:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update status');
  }
}
