export const handler = async (event) => {
  const API_KEY = process.env.TMDB_API_KEY;
  const { action, genreId, movieId } = event.queryStringParameters;
  const BASE_URL = 'https://api.themoviedb.org/3';

  if (!API_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Missing TMDB_API_KEY environment variable.' }) };
  }

  let url = '';
  
  switch (action) {
    case 'trending':
      url = `${BASE_URL}/trending/movie/week?api_key=${API_KEY}`;
      break;
    case 'genre':
      url = `${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}`;
      break;
    case 'video':
      url = `${BASE_URL}/movie/${movieId}/videos?api_key=${API_KEY}`;
      break;
    default:
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid action parameter.' }) };
  }

  try {
    const response = await fetch(url);
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Failed to fetch data from TMDb.' }) 
    };
  }
};
