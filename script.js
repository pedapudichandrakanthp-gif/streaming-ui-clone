const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const IMAGE_ORIGINAL_URL = 'https://image.tmdb.org/t/p/original';

const genres = [
  { name: 'AI / Sci-Fi', id: 878 },
  { name: 'Documentary', id: 528 }, // Note: 528 falls outside standard TMDB core genres, treating as generic ID request.
  { name: 'Drama', id: 18 },
  { name: 'Horror', id: 27 },
  { name: 'Comedy', id: 35 }
];

// Utility: Fetch from Netlify Function
async function fetchTMDB(params) {
  const query = new URLSearchParams(params).toString();
  const response = await fetch(`/api/tmdb?${query}`);
  if (!response.ok) throw new Error('Network response was not ok');
  return response.json();
}

// 1. Load Hero Section Trailer
async function loadHeroSection() {
  try {
    const data = await fetchTMDB({ action: 'trending' });
    const movies = data.results;
    if (!movies || movies.length === 0) return;

    // Pick a random trending movie
    const movie = movies[Math.floor(Math.random() * movies.length)];
    document.getElementById('hero-title').innerText = movie.title || movie.name;
    document.getElementById('hero-description').innerText = truncateText(movie.overview, 150);

    // Fetch video for this movie
    const videoData = await fetchTMDB({ action: 'video', movieId: movie.id });
    const trailer = videoData.results.find(vid => vid.type === 'Trailer' && vid.site === 'YouTube');

    const container = document.getElementById('hero-video-container');
    if (trailer) {
      container.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&loop=1&playlist=${trailer.key}&modestbranding=1" 
          frameborder="0" 
          allow="autoplay; encrypted-media" 
          allowfullscreen>
        </iframe>`;
    } else {
      // Fallback to backdrop image if no trailer exists
      container.innerHTML = `
        <div style="width: 100%; height: 100%; background-image: url(${IMAGE_ORIGINAL_URL}${movie.backdrop_path}); background-size: cover; background-position: center;"></div>
      `;
    }
  } catch (error) {
    console.error('Error loading hero section:', error);
  }
}

// 2. Load Movie Rows
async function loadRows() {
  const mainContent = document.getElementById('main-content');
  
  for (const genre of genres) {
    try {
      const data = await fetchTMDB({ action: 'genre', genreId: genre.id });
      if (!data.results.length) continue;

      const rowDiv = document.createElement('div');
      rowDiv.className = 'row';
      rowDiv.innerHTML = `<h2>${genre.name}</h2><div class="row-posters" id="row-${genre.id}"></div>`;
      mainContent.appendChild(rowDiv);

      const postersContainer = document.getElementById(`row-${genre.id}`);
      
      data.results.forEach(movie => {
        if (!movie.poster_path) return;
        
        const posterDiv = document.createElement('div');
        posterDiv.className = 'poster';
        posterDiv.dataset.id = movie.id;
        
        posterDiv.innerHTML = `
          <img src="${IMAGE_BASE_URL}${movie.poster_path}" alt="${movie.title}">
          <div class="poster-video"></div>
        `;

        // Handle Hover Previews
        let hoverTimer;
        posterDiv.addEventListener('mouseenter', () => {
          hoverTimer = setTimeout(() => loadHoverPreview(posterDiv, movie.id), 800); // 800ms intent delay
        });
        posterDiv.addEventListener('mouseleave', () => {
          clearTimeout(hoverTimer);
          posterDiv.querySelector('.poster-video').innerHTML = '';
        });

        postersContainer.appendChild(posterDiv);
      });
    } catch (error) {
      console.error(`Error loading row for genre ${genre.name}:`, error);
    }
  }
}

// 3. Hover Trailer Logic (TMDb uses YouTube, which requires iframe injection)
async function loadHoverPreview(posterElement, movieId) {
  const videoContainer = posterElement.querySelector('.poster-video');
  if (videoContainer.innerHTML !== '') return; // Already loaded

  try {
    const videoData = await fetchTMDB({ action: 'video', movieId: movieId });
    const clip = videoData.results.find(vid => vid.site === 'YouTube' && (vid.type === 'Teaser' || vid.type === 'Trailer'));
    
    if (clip) {
      videoContainer.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${clip.key}?autoplay=1&mute=1&controls=0&modestbranding=1" 
          width="100%" height="100%" 
          frameborder="0" allow="autoplay"
          style="object-fit: cover;">
        </iframe>`;
    }
  } catch (error) {
    // Ignore errors silently on hover to prevent console spam
  }
}

// 4. Login Modal Logic
function setupModal() {
  const modal = document.getElementById('login-modal');
  const loginBtn = document.getElementById('login-btn');
  const closeBtn = document.getElementById('close-modal');
  const form = document.getElementById('login-form');

  loginBtn.onclick = () => modal.classList.remove('hidden');
  closeBtn.onclick = () => modal.classList.add('hidden');
  window.onclick = (e) => { if (e.target === modal) modal.classList.add('hidden'); }
  
  form.onsubmit = (e) => {
    e.preventDefault();
    alert('Login functionality is UI only.');
    modal.classList.add('hidden');
  };
}

// Helpers
function truncateText(text, length) {
  if (!text) return '';
  return text.length > length ? text.substring(0, length) + '...' : text;
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  setupModal();
  loadHeroSection();
  loadRows();
});
