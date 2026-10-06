async function loadPortfolioData() {
    try {
        const response = await fetch('./data.json');
        const data = await response.json();

        // 1. RENDER SKILLS
        const sContainer = document.getElementById('skills-container');
        if (sContainer) {
            sContainer.innerHTML = data.skills.map(s => `
                <div class="bg-dark p-8 flex flex-col items-center gap-3 hover:bg-white/[0.02] transition-colors border-l border-white/5">
                    <i class="${s.icon} text-3xl text-accent"></i>
                    <span class="text-[10px] font-bold uppercase tracking-widest text-muted">${s.name}</span>
                </div>
            `).join('');
        }

        // 2. RENDER PROYECTOS
        const pContainer = document.getElementById('projects-container');
        if (pContainer) {
            pContainer.innerHTML = data.projects.map(p => {
                const isYouTube = p.video && (p.video.includes('youtube.com') || p.video.includes('youtu.be'));

                const mediaElement = isYouTube 
                    ? `<iframe class="w-full h-full border-0 pointer-events-auto" 
                              src="${p.video}" 
                              title="${p.title}" 
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                              allowfullscreen>
                       </iframe>`
                    : `<video class="project-video w-full h-full object-cover cursor-pointer" 
                              muted loop playsinline preload="auto" 
                              ontimeupdate="updateProgressBar(this)"
                              onclick="togglePlayPause(event, this)"
                              onplay="this.parentElement.querySelector('.play-indicator')?.classList.remove('opacity-100')"
                              onpause="if(this.closest('.project-card').classList.contains('expanded')) this.parentElement.querySelector('.play-indicator')?.classList.add('opacity-100')">
                            <source src="${p.video}" type="video/mp4">
                       </video>
                       <div class="play-indicator absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 transition-opacity duration-300 z-20">
                            <div class="bg-black/50 rounded-full p-5 border border-white/20 backdrop-blur-sm">
                                <svg class="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            </div>
                       </div>
                       <div class="video-progress-container" onclick="seekVideo(event, this)">
                            <div class="video-progress-bar"></div>
                       </div>`;

                return `
                <div class="project-card flex flex-col group" onclick="expandCard(this, event)">
                    <div class="relative aspect-video bg-black overflow-hidden">
                        ${mediaElement}

                        <div class="project-info absolute inset-0 p-6 flex flex-col justify-end bg-gradient-to-t from-black to-transparent transition-opacity group-[.expanded]:opacity-0 pointer-events-none z-10">
                            <span class="text-accent font-mono text-[10px] mb-1">${p.id}. ${p.category}</span>
                            <h3 class="text-lg font-bold uppercase tracking-tighter">${p.title}</h3>
                        </div>
                    </div>

                    <div class="p-6 p-content-container flex flex-col relative z-20" onwheel="customScroll(event, this)">
                        <a href="${p.github}" target="_blank" onclick="event.stopPropagation()" class="text-accent text-[10px] flex items-center gap-2 hover:underline mb-4 w-fit uppercase font-bold">
                            <i class="devicon-github-original text-base"></i> GitHub
                        </a>
                        
                        <div class="scroll-content text-muted text-sm leading-relaxed">
                            <h3 class="hidden group-[.expanded]:block text-2xl font-bold text-white mb-2">${p.title}</h3>
                            <div class="flex gap-2 mb-4 flex-wrap">
                                ${p.techs.map(t => `<span class="border border-white/10 px-2 py-0.5 text-[9px] uppercase bg-white/5">${t}</span>`).join('')}
                            </div>
                            <p>${p.description}</p>
                        </div>
                    </div>
                </div>`;
            }).join('');

            // Hover manual solo para videos locales
            document.querySelectorAll('.project-video').forEach(video => {
                const card = video.closest('.project-card');
                card.addEventListener('mouseenter', () => {
                    if (!card.classList.contains('expanded')) video.play().catch(() => {});
                });
                card.addEventListener('mouseleave', () => {
                    if (!card.classList.contains('expanded')) {
                        video.pause();
                        video.currentTime = 0;
                    }
                });
            });
        }
    } catch (e) { 
        console.error(e); 
    }
}

function customScroll(e, container) {
    const card = container.closest('.project-card');
    if (card && card.classList.contains('expanded')) {
        e.preventDefault();
        const scrollAmount = e.deltaY * 0.35; 
        container.scrollTop += scrollAmount;
    }
}

function togglePlayPause(e, video) {
    const card = video.closest('.project-card');
    if (card && card.classList.contains('expanded')) {
        e.stopPropagation(); 
        if (video.paused) {
            video.play();
        } else {
            video.pause();
        }
    }
}

function updateProgressBar(video) {
    const bar = video.parentElement.querySelector('.video-progress-bar');
    if (bar && video.duration) {
        const percentage = (video.currentTime / video.duration) * 100;
        bar.style.width = percentage + '%';
    }
}

function seekVideo(e, container) {
    e.stopPropagation();
    const video = container.parentElement.querySelector('video');
    if (!video) return;
    const rect = container.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    video.currentTime = percentage * video.duration;
}

function expandCard(card, event) {
    // Si se hace click dentro de un iframe o enlace, no interferir
    if (event.target.tagName === 'IFRAME') return;

    if (card.classList.contains('expanded')) {
        if (!event.target.closest('.p-content-container') && !event.target.closest('.video-progress-container')) {
            closeAllCards();
        }
        return;
    }

    closeAllCards();
    card.classList.add('expanded');
    document.body.classList.add('has-expanded');
    const v = card.querySelector('video');
    if (v) v.play().catch(() => {});
}

function closeAllCards() {
    document.body.classList.remove('has-expanded');
    document.querySelectorAll('.project-card').forEach(c => {
        c.classList.remove('expanded');
        const v = c.querySelector('video');
        if (v) { 
            v.pause(); 
            v.currentTime = 0; 
            const indicator = c.querySelector('.play-indicator');
            if (indicator) indicator.classList.remove('opacity-100');
        }
    });
}

document.addEventListener('click', (e) => { 
    if (e.target.classList.contains('body-overlay')) closeAllCards(); 
});

document.addEventListener('keydown', (e) => { 
    if (e.key === "Escape") closeAllCards(); 
});

const spotlight = document.getElementById('spotlight');
window.addEventListener('mousemove', e => {
    spotlight?.style.setProperty('--x', e.clientX + 'px');
    spotlight?.style.setProperty('--y', e.clientY + 'px');
});

document.addEventListener('DOMContentLoaded', loadPortfolioData);