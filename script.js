document.addEventListener('DOMContentLoaded', () => {
    // --- Element References ---
    const fileInput = document.getElementById('fileInput');
    const jsonTextInput = document.getElementById('jsonTextInput');
    const loadTextButton = document.getElementById('loadTextButton');
    const editorDiv = document.getElementById('editor');
    const saveSectionDiv = document.getElementById('save-section');
    const entryListDiv = document.getElementById('entryList');
    const addNewEntryButton = document.getElementById('addNewEntry');
    const saveButton = document.getElementById('saveButton');

    // Modal elements
    const modal = document.getElementById('entryModal');
    const modalTitle = document.getElementById('modalTitle');
    const closeModalButton = document.querySelector('.close-button');
    const entryForm = document.getElementById('entryForm');
    const entryIdInput = document.getElementById('entryId');
    const entryTypeSelect = document.getElementById('entryType');

    // Movie/Series fields
    const movieSeriesFields = document.getElementById('movieSeriesFields');
    const tmdbIdInput = document.getElementById('tmdbId');
    const fetchTMDbButton = document.getElementById('fetchTMDbButton');
    const entryTitleInput = document.getElementById('entryTitle');
    const entryYearInput = document.getElementById('entryYear');
    const entryDescriptionInput = document.getElementById('entryDescription');
    const entryImageInput = document.getElementById('entryImage');
    const entryCoverInput = document.getElementById('entryCover');
    const entryTrailerInput = document.getElementById('entryTrailer');
    const sourceListDiv = document.getElementById('sourceList');
    const sourceNameInput = document.getElementById('sourceNameInput');
    const sourceUrlInput = document.getElementById('sourceUrlInput');
    const addSourceButton = document.getElementById('addSourceButton');

    // Channel fields
    const channelFields = document.getElementById('channelFields');
    const channelTitleInput = document.getElementById('channelTitle');
    const channelImageInput = document.getElementById('channelImage');
    const channelRatingInput = document.getElementById('channelRating');
    const channelDescriptionInput = document.getElementById('channelDescription');
    const channelStreamUrlInput = document.getElementById('channelStreamUrl');

    const tmdbApiKey = 'ec926176bf467b3f7735e3154238c161';
    let jsonData = null;
    let currentSources = [];

    // --- Data Loading ---
    fileInput.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    loadData(e.target.result);
                } catch (error) {
                    alert('Error parsing JSON: ' + error.message);
                }
            };
            reader.readAsText(file);
        }
    });

    loadTextButton.addEventListener('click', () => {
        const text = jsonTextInput.value.trim();
        if (text) {
            try {
                loadData(text);
            } catch (error) {
                alert('Error parsing JSON from text: ' + error.message);
            }
        } else {
            alert('Text area is empty.');
        }
    });

    function loadData(jsonString) {
        jsonData = JSON.parse(jsonString);
        if (!jsonData.movies) jsonData.movies = [];
        if (!jsonData.channels) jsonData.channels = [];
        editorDiv.style.display = 'block';
        saveSectionDiv.style.display = 'block';
        renderEntries();
    }

    // --- Render Entries ---
    function renderEntries() {
        entryListDiv.innerHTML = '';
        const allEntries = [
            ...(jsonData.movies || []).map(e => ({ ...e, entryType: e.type || (e.seasons ? 'series' : 'movie') })),
            ...(jsonData.channels || []).map(e => ({ ...e, entryType: 'channel' }))
        ];
        allEntries.sort((a, b) => a.id - b.id);

        allEntries.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `
                <div class="entry-item-title">${entry.title} (${entry.entryType})</div>
                <div class="entry-item-actions">
                    <button class="edit-btn" data-id="${entry.id}" data-type="${entry.entryType}">Edit</button>
                    <button class="delete-btn" data-id="${entry.id}" data-type="${entry.entryType}">Delete</button>
                </div>
            `;
            entryListDiv.appendChild(item);
        });
    }

    // --- Modal & Form Type Handling ---
    function updateFormType() {
        const type = entryTypeSelect.value;
        if (type === 'channel') {
            movieSeriesFields.style.display = 'none';
            channelFields.style.display = 'block';
        } else {
            movieSeriesFields.style.display = 'block';
            channelFields.style.display = 'none';
        }
    }

    entryTypeSelect.addEventListener('change', updateFormType);

    function openModal() {
        modal.style.display = 'flex';
        updateFormType();
    }

    function closeModal() {
        modal.style.display = 'none';
        entryForm.reset();
        entryIdInput.value = '';
        currentSources = [];
        renderSources();
    }

    closeModalButton.addEventListener('click', closeModal);

    // --- CRUD Operations ---
    addNewEntryButton.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Entry';
        openModal();
    });

    entryListDiv.addEventListener('click', (event) => {
        const target = event.target;
        const id = target.dataset.id;
        const type = target.dataset.type;
        if (!id || !type) return;

        if (target.classList.contains('edit-btn')) {
            editEntry(id, type);
        } else if (target.classList.contains('delete-btn')) {
            deleteEntry(id, type);
        }
    });

    function editEntry(id, type) {
        let entry;
        if (type === 'channel') {
            entry = jsonData.channels.find(c => c.id == id);
        } else {
            entry = jsonData.movies.find(m => m.id == id);
        }
        if (!entry) return;

        modalTitle.textContent = 'Edit Entry';
        entryIdInput.value = entry.id;
        entryTypeSelect.value = type;
        updateFormType();

        if (type === 'channel') {
            channelTitleInput.value = entry.title || '';
            channelImageInput.value = entry.image || '';
            channelRatingInput.value = entry.rating || '';
            channelDescriptionInput.value = entry.description || '';
            channelStreamUrlInput.value = entry.sources && entry.sources[0] ? entry.sources[0].url : '';
        } else {
            entryTitleInput.value = entry.title || '';
            entryYearInput.value = entry.year || '';
            entryDescriptionInput.value = entry.description || '';
            entryImageInput.value = entry.image || '';
            entryCoverInput.value = entry.cover || '';
            entryTrailerInput.value = entry.trailer ? entry.trailer.url : '';
            currentSources = [...(entry.sources || [])];
            renderSources();
        }

        openModal();
    }

    function deleteEntry(id, type) {
        if (confirm('Are you sure you want to delete this entry?')) {
            let index = -1;
            if (type === 'channel') {
                index = jsonData.channels.findIndex(c => c.id == id);
                if (index > -1) {
                    jsonData.channels.splice(index, 1);
                }
            } else {
                index = jsonData.movies.findIndex(m => m.id == id);
                if (index > -1) {
                    jsonData.movies.splice(index, 1);
                }
            }
            renderEntries();
        }
    }

    entryForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const id = entryIdInput.value;
        const type = entryTypeSelect.value;

        if (type === 'channel') {
            saveChannel(id);
        } else {
            saveMovieSeries(id);
        }
        renderEntries();
        closeModal();
    });

    function saveMovieSeries(id) {
        const entryData = {
            type: entryTypeSelect.value,
            title: entryTitleInput.value,
            year: entryYearInput.value,
            description: entryDescriptionInput.value,
            image: entryImageInput.value,
            cover: entryCoverInput.value,
            trailer: entryTrailerInput.value ? { url: entryTrailerInput.value } : null,
            sources: currentSources,
        };

        if (id) {
            const index = jsonData.movies.findIndex(m => m.id == id);
            if (index > -1) {
                const existingEntry = jsonData.movies[index];
                jsonData.movies[index] = { ...existingEntry, ...entryData, id: parseInt(id) };
            }
        } else {
            const allIds = [...jsonData.movies.map(m => m.id), ...jsonData.channels.map(c => c.id)];
            const newId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
            const newEntry = {
                id: newId, ...entryData, genres: [], actors: [], subtitles: [], comments: [],
            };
            jsonData.movies.push(newEntry);
        }
    }

    function saveChannel(id) {
        const entryData = {
            title: channelTitleInput.value,
            image: channelImageInput.value,
            rating: parseFloat(channelRatingInput.value) || 0,
            description: channelDescriptionInput.value,
            sources: channelStreamUrlInput.value ? [{ type: 'live', url: channelStreamUrlInput.value }] : [],
        };

        if (id) {
            const index = jsonData.channels.findIndex(c => c.id == id);
            if (index > -1) {
                const existingEntry = jsonData.channels[index];
                jsonData.channels[index] = { ...existingEntry, ...entryData, id: parseInt(id) };
            }
        } else {
            const allIds = [...jsonData.movies.map(m => m.id), ...jsonData.channels.map(c => c.id)];
            const newId = allIds.length > 0 ? Math.max(...allIds) + 1 : 1;
            const newEntry = {
                id: newId, ...entryData, type: 'channel', categories: [], countries: [], comments: []
            };
            jsonData.channels.push(newEntry);
        }
    }

    // --- Source Management ---
    function renderSources() {
        sourceListDiv.innerHTML = '';
        currentSources.forEach((source, index) => {
            const item = document.createElement('div');
            item.className = 'source-item';
            item.innerHTML = `
                <span>${source.title || 'Source'}: ${source.url}</span>
                <button type="button" class="remove-source-btn" data-index="${index}">&times;</button>
            `;
            sourceListDiv.appendChild(item);
        });
    }

    addSourceButton.addEventListener('click', () => {
        const name = sourceNameInput.value.trim();
        const url = sourceUrlInput.value.trim();
        if (url) {
            currentSources.push({ title: name, url: url, type: 'video' });
            sourceNameInput.value = '';
            sourceUrlInput.value = '';
            renderSources();
        }
    });

    sourceListDiv.addEventListener('click', (event) => {
        if (event.target.classList.contains('remove-source-btn')) {
            const index = parseInt(event.target.dataset.index, 10);
            currentSources.splice(index, 1);
            renderSources();
        }
    });

    // --- TMDb Integration ---

    // Helper function to populate form fields from TMDb data
    async function populateFormWithTMDb(details, type, tmdbId) {
        // Update form fields
        entryTitleInput.value = details.title || details.name || '';
        entryDescriptionInput.value = details.overview || '';
        const releaseDate = details.release_date || details.first_air_date || '';
        entryYearInput.value = releaseDate ? releaseDate.split('-')[0] : '';
        entryImageInput.value = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
        entryCoverInput.value = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';

        // Fetch and set trailer URL
        const videosUrl = `https://api.themoviedb.org/3/${type}/${tmdbId}/videos?api_key=${tmdbApiKey}`;
        const videosRes = await fetch(videosUrl);
        const videosData = videosRes.ok ? await videosRes.json() : { results: [] };
        const trailer = videosData.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');
        if (trailer) {
            entryTrailerInput.value = `https://www.youtube.com/watch?v=${trailer.key}`;
        } else {
            entryTrailerInput.value = ''; // Clear if no trailer found
        }

        // Auto-add vidsrc.net source
        const vidsrcUrl = `https://vidsrc.net/embed/${type}?tmdb=${tmdbId}`;
        const existingSource = currentSources.find(s => s.url === vidsrcUrl);
        if (!existingSource) {
            currentSources.unshift({ title: 'vidsrc.net', url: vidsrcUrl, type: 'video' });
        }
        renderSources();
    }

    fetchTMDbButton.addEventListener('click', async () => {
        const tmdbId = tmdbIdInput.value.trim();
        if (!tmdbId) {
            alert('Please enter a TMDb ID.');
            return;
        }

        const baseUrl = 'https://api.themoviedb.org/3';
        let details = null;
        let type = null;

        // Try fetching as a movie first
        try {
            const movieUrl = `${baseUrl}/movie/${tmdbId}?api_key=${tmdbApiKey}`;
            const res = await fetch(movieUrl);
            if (res.ok) {
                details = await res.json();
                type = 'movie';
            } else if (res.status === 404) {
                // If not found, try fetching as a series
                const seriesUrl = `${baseUrl}/tv/${tmdbId}?api_key=${tmdbApiKey}`;
                const seriesRes = await fetch(seriesUrl);
                if (seriesRes.ok) {
                    details = await seriesRes.json();
                    type = 'series';
                } else {
                    // If series also not found, throw an error
                    throw new Error('ID not found as a movie or series.');
                }
            } else {
                // Handle other non-404 errors for the movie fetch
                throw new Error(`API error fetching movie: ${res.statusText}`);
            }
        } catch (error) {
            alert(`Error fetching from TMDb: ${error.message}`);
            return;
        }

        // If we found something, populate the form
        if (details && type) {
            entryTypeSelect.value = type; // Set the dropdown to the detected type
            try {
                await populateFormWithTMDb(details, type, tmdbId);
            } catch (populateError) {
                alert(`Error populating form: ${populateError.message}`);
            }
        }
    });

    // --- Save and Download ---
    saveButton.addEventListener('click', () => {
        if (!jsonData) {
            alert('No data to save.');
            return;
        }
        const jsonString = JSON.stringify(jsonData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'free_movie_api_edited.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
});
