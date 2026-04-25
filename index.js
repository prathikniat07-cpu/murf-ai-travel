// --- Constants ---
const VOICES = {
  English: { Male: "en-US-matthew", Female: "en-US-alicia" },
  Hindi: { Male: "hi-IN-aman", Female: "hi-IN-namrita" },
  Tamil: { Male: "ta-IN-murali", Female: "ta-IN-iniya" },
  Telugu: { Male: "te-IN-navya", Female: "te-IN-vaishnavi" }
};

const LOCALES = {
  English: "en-US",
  Hindi: "hi-IN",
  Tamil: "ta-IN",
  Telugu: "te-IN"
};

// --- State ---
const state = {
  place: '',
  image: '',
  length: 'Summary',
  voice: 'Male'
};

// --- DOM Elements ---
const cardsContainer = document.querySelector('.cards');
const experiencePanel = document.getElementById('experience');
const previewTitle = document.getElementById('previewTitle');
const audioSection = document.getElementById('audioSection');
const audioPlayer = document.getElementById('audioPlayer');
const transcriptText = document.getElementById('scriptText');
const generateButton = document.getElementById('generateBtn');
const languageSelect = document.getElementById('selectLanguage');
const closeButton = document.getElementById('closeExperience');
const searchPreviewCard = document.getElementById('searchPreviewCard');
const searchPreviewImage = document.getElementById('searchPreviewImage');
const searchPreviewTitle = document.getElementById('searchPreviewTitle');
const transcriptToggle = document.getElementById('transcriptToggle');
const transcriptContent = document.getElementById('transcriptContent');
const transcriptArrow = document.getElementById('transcriptArrow');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// --- Functions ---
function selectDestination(place, image, clickedCard = null) {
  state.place = place;
  state.image = image;
  previewTitle.textContent = place;
  cardsContainer.classList.add('faded');
  document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));
  searchPreviewCard.classList.add('hidden');
  if (clickedCard) {
    clickedCard.classList.add('active');
  } else {
    searchPreviewImage.src = image;
    searchPreviewTitle.textContent = place;
    searchPreviewCard.classList.remove('hidden');
    searchPreviewCard.classList.add('active');
  }
  audioSection.classList.add('hidden');
  audioPlayer.src = '';
  transcriptText.textContent = '';
  generateButton.textContent = 'Generate Audio Guide';
  generateButton.disabled = false;
  experiencePanel.classList.remove('hidden');
  setTimeout(() => { experiencePanel.classList.add('visible'); }, 10);
}

function deselectDestination() {
  experiencePanel.classList.remove('visible');
  setTimeout(() => {
    experiencePanel.classList.add('hidden');
    cardsContainer.classList.remove('faded');
    searchPreviewCard.classList.add('hidden');
    document.querySelectorAll('.place-card').forEach(card => card.classList.remove('active'));
  }, 300);
}

closeButton.addEventListener('click', deselectDestination);

document.querySelectorAll('.place-card:not(.search-preview-card)').forEach(card => {
  card.addEventListener('click', () => {
    selectDestination(card.dataset.place, card.dataset.image, card);
  });
});

const lengthButtons = document.querySelectorAll('[data-group="length"] button');
lengthButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    lengthButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.length = btn.dataset.value;
  });
});

const voiceButtons = document.querySelectorAll('[data-group="voice"] button');
voiceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    voiceButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.voice = btn.dataset.value;
  });
});

generateButton.addEventListener('click', async () => {
  generateButton.disabled = true;
  generateButton.textContent = '⏳ Generating Audio...';
  try {
    const selectedLanguage = languageSelect.value;
    const selectedVoice = state.voice;
    const response = await fetch("/generate-audio-guide", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place: state.place,
        answerType: state.length,
        language: selectedLanguage,
        voiceId: VOICES[selectedLanguage][selectedVoice],
        locale: LOCALES[selectedLanguage]
      })
    });
    if (!response.ok) throw new Error('Generation failed');
    const data = await response.json();
    transcriptText.textContent = data.description;
    audioSection.classList.remove('hidden');
    if (data.audioBase64) {
      audioPlayer.src = `data:audio/mp3;base64,${data.audioBase64}`;
      audioPlayer.load();
      audioPlayer.classList.remove('hidden');
      generateButton.textContent = 'Listen to Audio';
      audioPlayer.play();
    }
  } catch (err) {
    alert('Failed: ' + err.message);
    generateButton.textContent = 'Generate Audio Guide';
    generateButton.disabled = false;
  }
});

async function handleSearch() {
  const query = searchInput.value.trim();
  if (!query) return;
  searchBtn.textContent = '...';
  try {
    const response = await fetch("/search-destination", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await response.json();
    if (data.isPlace) {
      selectDestination(data.name, data.imageUrl);
    } else {
      alert("Not found!");
    }
  } catch (err) {
    alert("Search failed.");
  } finally {
    searchBtn.textContent = 'Explore';
  }
}

searchBtn.addEventListener('click', handleSearch);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });

transcriptToggle.addEventListener('click', () => {
  transcriptContent.classList.toggle('hidden');
  transcriptArrow.classList.toggle('rotate-180');
});
