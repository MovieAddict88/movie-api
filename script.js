document.addEventListener('DOMContentLoaded', () => {
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
    const entryTitleInput = document.getElementById('entryTitle');
    const entryYearInput = document.getElementById('entryYear');
    const entryDescriptionInput = document.getElementById('entryDescription');
    const entryImageInput = document.getElementById('entryImage');
    const entryCoverInput = document.getElementById('entryCover');
    const entryTrailerInput = document.getElementById('entryTrailer');

    // TMDb elements
    const tmdbIdInput = document.getElementById('tmdbId');
    const fetchTMDbButton = document.getElementById('fetchTMDbButton');
    const tmdbApiKey = 'ec926176bf467b3f7735e3154238c161';

    let jsonData = null;

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
        if (!jsonData.movies) {
            jsonData.movies = []; // Ensure movies array exists
        }
        editorDiv.style.display = 'block';
        saveSectionDiv.style.display = 'block';
        renderEntries();
    }

    // --- Render Entries ---
    function renderEntries() {
        entryListDiv.innerHTML = '';
        if (!jsonData || !jsonData.movies) return;

        jsonData.movies.forEach(entry => {
            const item = document.createElement('div');
            item.className = 'entry-item';
            item.innerHTML = `
                <div class="entry-item-title">${entry.title} (${entry.type})</div>
                <div class="entry-item-actions">
                    <button class="edit-btn" data-id="${entry.id}">Edit</button>
                    <button class="delete-btn" data-id="${entry.id}">Delete</button>
                </div>
            `;
            entryListDiv.appendChild(item);
        });
    }

    // --- Modal Handling ---
    function openModal() {
        modal.style.display = 'flex';
    }

    function closeModal() {
        modal.style.display = 'none';
        entryForm.reset();
        entryIdInput.value = '';
    }

    closeModalButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });

    // --- CRUD Operations ---
    addNewEntryButton.addEventListener('click', () => {
        modalTitle.textContent = 'Add New Entry';
        openModal();
    });

    entryListDiv.addEventListener('click', (event) => {
        const target = event.target;
        const id = target.dataset.id;
        if (!id) return;

        if (target.classList.contains('edit-btn')) {
            editEntry(id);
        } else if (target.classList.contains('delete-btn')) {
            deleteEntry(id);
        }
    });

    function editEntry(id) {
        const entry = jsonData.movies.find(m => m.id == id);
        if (!entry) return;

        modalTitle.textContent = 'Edit Entry';
        entryIdInput.value = entry.id;
        entryTypeSelect.value = entry.type || 'movie';
        entryTitleInput.value = entry.title || '';
        entryYearInput.value = entry.year || '';
        entryDescriptionInput.value = entry.description || '';
        entryImageInput.value = entry.image || '';
        entryCoverInput.value = entry.cover || '';
        entryTrailerInput.value = entry.trailer ? entry.trailer.url : '';

        openModal();
    }

    function deleteEntry(id) {
        if (confirm('Are you sure you want to delete this entry?')) {
            const index = jsonData.movies.findIndex(m => m.id == id);
            if (index > -1) {
                jsonData.movies.splice(index, 1);
                renderEntries();
            }
        }
    }

    entryForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const id = entryIdInput.value;
        const entryData = {
            type: entryTypeSelect.value,
            title: entryTitleInput.value,
            year: entryYearInput.value,
            description: entryDescriptionInput.value,
            image: entryImageInput.value,
            cover: entryCoverInput.value,
            trailer: entryTrailerInput.value ? { url: entryTrailerInput.value } : null,
            // Keep other complex properties if they exist
        };

        if (id) { // Update existing
            const index = jsonData.movies.findIndex(m => m.id == id);
            if (index > -1) {
                const existingEntry = jsonData.movies[index];
                jsonData.movies[index] = { ...existingEntry, ...entryData, id: parseInt(id) };
            }
        } else { // Create new
            const newId = jsonData.movies.length > 0 ? Math.max(...jsonData.movies.map(m => m.id)) + 1 : 1;
            const newEntry = {
                id: newId,
                ...entryData,
                // Add default structures for other properties
                genres: [],
                sources: [],
                actors: [],
                subtitles: [],
                comments: [],
            };
            jsonData.movies.push(newEntry);
        }
        renderEntries();
        closeModal();
    });

    // --- TMDb Integration ---
    fetchTMDbButton.addEventListener('click', async () => {
        const tmdbId = tmdbIdInput.value.trim();
        const type = entryTypeSelect.value;
        if (!tmdbId) {
            alert('Please enter a TMDb ID.');
            return;
        }

        const baseUrl = 'https://api.themoviedb.org/3';
        const detailsUrl = `${baseUrl}/${type}/${tmdbId}?api_key=${tmdbApiKey}`;
        const videosUrl = `${baseUrl}/${type}/${tmdbId}/videos?api_key=${tmdbApiKey}`;

        try {
            // Fetch main details
            const detailsRes = await fetch(detailsUrl);
            if (!detailsRes.ok) throw new Error('Could not fetch TMDb details.');
            const details = await detailsRes.json();

            // Fetch videos
            const videosRes = await fetch(videosUrl);
            if (!videosRes.ok) throw new Error('Could not fetch TMDb videos.');
            const videosData = await videosRes.json();
            const trailer = videosData.results.find(v => v.site === 'YouTube' && v.type === 'Trailer');

            // Populate form
            entryTitleInput.value = details.title || details.name || '';
            entryDescriptionInput.value = details.overview || '';
            const releaseDate = details.release_date || details.first_air_date || '';
            entryYearInput.value = releaseDate ? releaseDate.split('-')[0] : '';
            entryImageInput.value = details.poster_path ? `https://image.tmdb.org/t/p/w500${details.poster_path}` : '';
            entryCoverInput.value = details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '';
            if (trailer) {
                entryTrailerInput.value = `https://www.youtube.com/watch?v=${trailer.key}`;
            }

        } catch (error) {
            alert('Error fetching from TMDb: ' + error.message);
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
