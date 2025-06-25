// Dados das meditações
const meditations = [
    {
        id: 1,
        title: "Respiração para Ansiedade",
        description: "Exercício de 1 minuto para acalmar a mente em momentos de crise",
        duration: "1 min",
        category: "Ansiedade",
        level: "Iniciante",
        audio: "assets/songs/Fairy-Fountain.mp3"
    },
    {
        id: 2,
        title: "Meditação do Corpo Scan",
        description: "Percepção corporal para liberar tensões físicas e mentais",
        duration: "6 min",
        category: "Estresse",
        level: "Intermediário",
        audio: "assets/songs/healing-sleep-atmosphere-332304.mp3"
    },
    {
        id: 3,
        title: "Visualização Guiada",
        description: "Imagine um lugar seguro para reduzir sintomas de depressão",
        duration: "4 min",
        category: "Depressão",
        level: "Iniciante",
        audio: "assets/songs/rainy-lofi-city-lofi-music-332746.mp3"
    },
    {
        id: 4,
        title: "Mindfulness para Foco",
        description: "Treine sua atenção plena para melhorar concentração",
        duration: "2 min",
        category: "Foco",
        level: "Avançado",
        audio: "assets/songs/spring-lofi-vibes-lofi-music-340019.mp3"
    },
    {
        id: 5,
        title: "Relaxamento para Dormir",
        description: "Técnicas para acalmar a mente antes de dormir",
        duration: "20 min",
        category: "Sono",
        level: "Iniciante",
        audio: "assets/songs/sleep-music-vol16-195422.mp3"
    },
    
    
];








const meditationGrid = document.querySelector('.meditation-grid') || document.createElement('div');
const audioPlayer = document.querySelector('.audio-player') || document.createElement('div');
const audioElement = document.getElementById('meditation-audio') || document.createElement('audio');
const trackTitle = document.getElementById('track-title') || document.createElement('h4');
const trackDesc = document.getElementById('track-desc') || document.createElement('p');
const playBtn = document.getElementById('play-btn') || document.createElement('button');
const pauseBtn = document.getElementById('pause-btn') || document.createElement('button');
const progressBar = document.getElementById('progress-bar') || document.createElement('progress');
const currentTimeEl = document.getElementById('current-time') || document.createElement('span');
const durationEl = document.getElementById('duration') || document.createElement('span');
const closePlayer = document.getElementById('close-player') || document.createElement('button');
const filterButtons = document.querySelectorAll('.filter-btn') || [];





let currentMeditation = null;
const apiUrl = 'https://12d88d11-bf7c-4a60-adc6-de173aa536e8-00-2r4bfxqpkwg9l.kirk.replit.dev/meditacoes';








const fallbackMeditations = [
  {
    id: 1,
    titulo: "Respiração para Ansiedade",
    conteudo: "Exercício de 1 minuto para acalmar a mente em momentos de crise",
    duracao: "1 min",
    categoria: "Ansiedade",
    nivel: "Iniciante",
    audio: "assets/songs/Fairy-Fountain.mp3"
  },
  {
    id: 2,
    titulo: "Meditação do Corpo Scan",
    conteudo: "Percepção corporal para liberar tensões físicas e mentais",
    duracao: "6 min",
    categoria: "Estresse",
    nivel: "Intermediário",
    audio: "assets/songs/healing-sleep-atmosphere-332304.mp3"
  },
  {
    id: 3,
    titulo: "Visualização Guiada",
    conteudo: "Imagine um lugar seguro para reduzir sintomas de depressão",
    duracao: "4 min",
    categoria: "Depressão",
    nivel: "Iniciante",
    audio: "assets/songs/rainy-lofi-city-lofi-music-332746.mp3"
  },
  {
    id: 4,
    titulo: "Mindfulness para Foco",
    conteudo: "Treine sua atenção plena para melhorar concentração",
    duracao: "2 min",
    categoria: "Foco",
    nivel: "Avançado",
    audio: "assets/songs/spring-lofi-vibes-lofi-music-340019.mp3"
  },
  {
    id: 5,
    titulo: "Relaxamento para Dormir",
    conteudo: "Técnicas para acalmar a mente antes de dormir",
    duracao: "20 min",
    categoria: "Sono",
    nivel: "Iniciante",
    audio: "assets/songs/sleep-music-vol16-195422.mp3"
  }
];






function loadMeditations(filter = 'Todos') {
  fetch(apiUrl)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Dados retornados pela API:', data);
      


      const meditationsData = data.meditacoes || data;
      const filteredMeditations = filter === 'Todos' 
        ? meditationsData 
        : meditationsData.filter(m => m.categoria === filter);
      
      if (!filteredMeditations || filteredMeditations.length === 0) {
        useFallbackData(filter);
        return;
      }

      renderMeditations(filteredMeditations);
    })
    .catch(error => {
      console.error('Erro ao carregar meditações da API:', error);
      useFallbackData(filter);
    });
}




function useFallbackData(filter) {
  const filteredMeditations = filter === 'Todos' 
    ? fallbackMeditations 
    : fallbackMeditations.filter(m => m.categoria === filter);
  renderMeditations(filteredMeditations);
}




function renderMeditations(meditations) {
  if (!meditations || meditations.length === 0) {
    meditationGrid.innerHTML = '<p>Nenhuma meditação encontrada.</p>';
    return;
  }

  meditationGrid.innerHTML = '';
  meditations.forEach(meditation => {
    const card = document.createElement('div');
    card.className = 'meditation-card';
    card.innerHTML = `
      <div class="card-image">
        <i class="fas fa-spa"></i>
      </div>
      <div class="card-content">
        <h4>${meditation.titulo}</h4>
        <p>${meditation.conteudo}</p>
        <div class="card-meta">
          <span>${meditation.duracao} • ${meditation.nivel}</span>
          <button class="play-button" data-id="${meditation.id}">
            <i class="fas fa-play"></i>
          </button>
        </div>
      </div>
    `;
    meditationGrid.appendChild(card);
  });

  document.querySelectorAll('.play-button').forEach(button => {
    button.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.getAttribute('data-id'));
      playMeditation(id);
    });
  });
}





function playMeditation(id) {
  fetch(`${apiUrl}/${id}`)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      currentMeditation = Array.isArray(data) ? data[0] : data;
      
      if (!currentMeditation) {
        console.error('Meditação não encontrada para o ID:', id);
        useFallbackForPlay(id);
        return;
      }
      
      updatePlayer(currentMeditation);
    })
    .catch(error => {
      console.error('Erro ao carregar meditação da API:', error);
      useFallbackForPlay(id);
    });
}





function useFallbackForPlay(id) {
  currentMeditation = fallbackMeditations.find(m => m.id === id);
  if (currentMeditation) {
    updatePlayer(currentMeditation);
  } else {
    console.error('Meditação não encontrada no fallback para o ID:', id);
  }
}





function updatePlayer(meditation) {
  trackTitle.textContent = meditation.titulo;
  trackDesc.textContent = meditation.conteudo;
  audioElement.src = meditation.audio;
  
  audioPlayer.classList.remove('hidden');
  audioPlayer.classList.add('visible');
  
  audioElement.load();
  audioElement.play()
    .then(() => {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    })
    .catch(error => {
      console.error("Erro ao reproduzir áudio:", error);
    });
}





function updateProgressBar() {
  const { currentTime, duration } = audioElement;
  const progressPercent = (currentTime / duration) * 100;
  progressBar.value = progressPercent;
  
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  currentTimeEl.textContent = formatTime(currentTime);
  
  if (!isNaN(duration)) {
    durationEl.textContent = formatTime(duration);
  }
}






audioElement.addEventListener('timeupdate', updateProgressBar);
audioElement.addEventListener('ended', () => {
  progressBar.value = 0;
  currentTimeEl.textContent = '0:00';
  playBtn.style.display = 'block';
  pauseBtn.style.display = 'none';
});

playBtn.addEventListener('click', () => {
  audioElement.play();
  playBtn.style.display = 'none';
  pauseBtn.style.display = 'block';
});

pauseBtn.addEventListener('click', () => {
  audioElement.pause();
  playBtn.style.display = 'block';
  pauseBtn.style.display = 'none';
});

closePlayer.addEventListener('click', () => {
  audioElement.pause();
  audioPlayer.classList.remove('visible');
  audioPlayer.classList.add('hidden');
  playBtn.style.display = 'block';
  pauseBtn.style.display = 'none';
});






filterButtons.forEach(button => {
  button.addEventListener('click', () => {
    filterButtons.forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    loadMeditations(button.textContent);
  });
});




document.addEventListener('DOMContentLoaded', () => {
  loadMeditations();
});