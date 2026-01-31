const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-button');
const platformSelect = document.getElementById('platform-select');
const genreSelect = document.getElementById('genre-select');
const yearSelect = document.getElementById('year-select');
const orderingSelect = document.getElementById('ordering-select');
const modal = document.getElementById('game-modal');
const modalBody = document.getElementById('modal-body');

const merkez = 400; 
canvas.width = 800;
canvas.height = 800;

let dinamikOyunlar = [];
let mevcutDerece = 0;

const logo = new Image();
logo.src = 'logo.png';

const markaRenkleri = ["#00f2ff", "#bc13fe"];

window.onload = () => {
    const intro = document.getElementById('intro-screen');
    setTimeout(() => {
        if (intro) {
            intro.classList.add('fade-out');
            varsayilanCarkiYukle();
            setTimeout(() => intro.remove(), 1000);
        }
    }, 2500);
};

function varsayilanCarkiYukle() {
    dinamikOyunlar = Array(8).fill(null).map((_, i) => ({
        ad: "NE OYNASAM?",
        renk: markaRenkleri[i % 2]
    }));
    carkiCiz();
}

function carkiCiz() {
    const dilimSayisi = dinamikOyunlar.length;
    const aci = (2 * Math.PI) / dilimSayisi;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    dinamikOyunlar.forEach((oyun, i) => {
        ctx.save();
        ctx.beginPath();
        ctx.fillStyle = oyun.renk;
        ctx.moveTo(merkez, merkez);
        ctx.arc(merkez, merkez, merkez - 10, i * aci, (i + 1) * aci);
        ctx.fill();
        
        ctx.translate(merkez, merkez);
        ctx.rotate(i * aci + aci / 2);
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "white";
        
        const fontSize = dilimSayisi > 12 ? "18px" : "22px";
        ctx.font = `bold ${fontSize} Poppins`;
        
        const temizAd = oyun.ad.length > 20 ? oyun.ad.substring(0, 18) + ".." : oyun.ad;
        ctx.fillText(temizAd, merkez - 50, 0);
        ctx.restore();
    });

    merkezLogoyuCiz();
}

function merkezLogoyuCiz() {
    if (logo.complete) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(merkez, merkez, 65, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(logo, merkez - 65, merkez - 65, 130, 130);
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(merkez, merkez, 65, 0, Math.PI * 2);
        ctx.strokeStyle = "#00f2ff";
        ctx.lineWidth = 5;
        ctx.stroke();
    } else {
        logo.onload = () => carkiCiz();
    }
}

async function oyunlariTazeleVeDon() {
    spinBtn.disabled = true; 
    spinBtn.innerText = "YÜKLENİYOR...";
    
    const yearFilter = yearSelect.value ? `&dates=${yearSelect.value}` : '';
    const ordering = orderingSelect.value || '-added';
    const genreFilter = genreSelect.value ? `&genres=${genreSelect.value}` : '';
    const url = `https://api.rawg.io/api/games?key=${API_KEY}&platforms=${platformSelect.value}${genreFilter}${yearFilter}&ordering=${ordering}&metacritic=70,100&page_size=12&page=1`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.results && data.results.length > 0) {
            dinamikOyunlar = data.results.map((o, i) => ({ 
                ad: o.name, 
                id: o.slug, 
                renk: markaRenkleri[i % 2] 
            }));
            
            carkiCiz();
            if (typeof startSpinAudio === "function") startSpinAudio();

            const donus = Math.floor(Math.random() * 360) + 2160; 
            mevcutDerece += donus;
            canvas.style.transform = `rotate(${mevcutDerece}deg)`;

            setTimeout(() => {
                if (typeof stopSpinAudio === "function") stopSpinAudio();
                
                document.body.classList.add('flash-effect');
                canvas.classList.add('shake', 'wheel-winner-active');
                
                setTimeout(() => {
                    document.body.classList.remove('flash-effect');
                    canvas.classList.remove('shake');
                }, 500);

                spinBtn.disabled = false; 
                spinBtn.innerText = "ÇEVİR";
                
                const normalize = (mevcutDerece % 360);
                const index = Math.floor(((270 - normalize + 360) % 360) / (360 / dinamikOyunlar.length));
                
                konfetiPatlat();
                detayGetir(dinamikOyunlar[index].id);
            }, 4000);
        } else {
            alert("Sonuç bulunamadı!");
            spinBtn.disabled = false;
            spinBtn.innerText = "ÇEVİR";
        }
    } catch (e) { 
        spinBtn.disabled = false; 
        spinBtn.innerText = "HATA!";
        console.error(e);
    }
}

function konfetiPatlat() {
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#00f2ff', '#bc13fe']
    });
}

async function detayGetir(slug) {
    try {
        const [gameRes, screenRes, storeRes] = await Promise.all([
            fetch(`https://api.rawg.io/api/games/${slug}?key=${API_KEY}`),
            fetch(`https://api.rawg.io/api/games/${slug}/screenshots?key=${API_KEY}`),
            fetch(`https://api.rawg.io/api/games/${slug}/stores?key=${API_KEY}`)
        ]);
        
        const game = await gameRes.json();
        const screens = await screenRes.json();
        const stores = await storeRes.json();

        const storeHtml = stores.results.map(s => {
            let icon = "fa-solid fa-cart-shopping", className = "";
            switch(s.store_id) {
                case 1: icon = "fa-brands fa-steam"; className = "steam"; break;
                case 3: icon = "fa-brands fa-playstation"; className = "playstation"; break;
                case 7: icon = "fa-brands fa-xbox"; className = "xbox"; break;
                case 11: icon = "fa-solid fa-bag-shopping"; className = "epic"; break;
            }
            return `<a href="${s.url}" target="_blank" class="store-btn ${className}"><i class="${icon}"></i></a>`;
        }).join('');

        const galleryHtml = screens.results.slice(0, 4).map(img => 
            `<img src="${img.image}" onclick="resmiEkranaAc(this.src)" class="gallery-thumb">`
        ).join('');

        modalBody.innerHTML = `
            <div class="modal-wrapper">
                <div class="store-top-bar">${storeHtml}</div>
                <div class="middle-grid">
                    <div class="independent-card">
                        <div class="panel-header"><i class="fa-solid fa-microchip"></i> SİSTEM</div>
                        <div class="req-text">
                            ${game.platforms?.find(p => p.platform.id === 4)?.requirements?.minimum || "Detay yok."}
                        </div>
                    </div>
                    <div class="independent-card center-card">
                        <img src="${game.background_image}" class="main-img-top">
                        <h2>${game.name}</h2>
                        <div class="meta-score">⭐ Metascore: ${game.metacritic || "N/A"}</div>
                        <a href="https://www.youtube.com/results?search_query=${game.name}+official+trailer" target="_blank" class="trailer-btn">
                            <i class="fa-brands fa-youtube"></i> FRAGMAN
                        </a>
                    </div>
                    <div class="independent-card">
                        <div class="panel-header"><i class="fa-solid fa-image"></i> GÖRÜNTÜLER</div>
                        <div class="gallery-grid">${galleryHtml}</div>
                    </div>
                </div>
                <div class="about-bottom-card">
                    <div class="panel-header">OYUN HAKKINDA</div>
                    <p>${game.description_raw?.substring(0, 500) || "Açıklama mevcut değil."}...</p>
                    <div class="modal-footer"><span class="close-btn" onclick="modalKapat()">KAPAT</span></div>
                </div>
            </div>
        `;
        modal.style.display = "flex";
    } catch (err) {
        console.error("Hata:", err);
    }
}

function resmiEkranaAc(src) {
    const overlay = document.createElement('div');
    overlay.className = "image-overlay";
    overlay.innerHTML = `<img src="${src}">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

function modalKapat() { modal.style.display = "none"; }
spinBtn.addEventListener('click', oyunlariTazeleVeDon);