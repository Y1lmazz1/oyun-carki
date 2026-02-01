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

const spaceCanvas = document.getElementById('spaceCanvas');
const sCtx = spaceCanvas.getContext('2d');
let stars = [];
let uzayHizi = 0.0005; // Normal akış hızı

function resizeSpace() {
    spaceCanvas.width = window.innerWidth;
    spaceCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeSpace);
resizeSpace();

// Yıldızları oluştur
for (let i = 0; i < 400; i++) {
    stars.push({
        x: Math.random() * 2 - 1,
        y: Math.random() * 2 - 1,
        size: Math.random() * 1.5,
        color: Math.random() > 0.5 ? "#00f2ff" : "#bc13fe"
    });
}

function spaceAnimate() {
    
    sCtx.clearRect(0, 0, spaceCanvas.width, spaceCanvas.height);
    const cx = spaceCanvas.width / 2;
    const cy = spaceCanvas.height / 2;
    const radius = Math.max(cx, cy);

    stars.forEach(s => {
        // Yıldızları döndür
        const angle = uzayHizi;
        const x = s.x * Math.cos(angle) - s.y * Math.sin(angle);
        const y = s.y * Math.cos(angle) + s.x * Math.sin(angle);
        s.x = x;
        s.y = y;

        const px = x * radius + cx;
        const py = y * radius + cy;

        sCtx.beginPath();
        sCtx.arc(px, py, s.size, 0, Math.PI * 2);
        sCtx.fillStyle = s.color;
        sCtx.fill();
    });
    requestAnimationFrame(spaceAnimate);
}
spaceAnimate();

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
    const container = document.querySelector('.wheel-container');
    
    // 1. Başlangıç Durumu
    container.classList.add('is-loading'); 
    uzayHizi = 0.08; // Galaksiyi ateşle
    spinBtn.disabled = true; 
    spinBtn.innerText = "YÜKLENİYOR...";
    
    const rastgeleSayfa = Math.floor(Math.random() * 5) + 1; 
    const yearFilter = yearSelect.value ? `&dates=${yearSelect.value}` : '';
    const ordering = orderingSelect.value || '-added';
    const genreFilter = genreSelect.value ? `&genres=${genreSelect.value}` : '';
    
    const url = `https://api.rawg.io/api/games?key=${API_KEY}&platforms=${platformSelect.value}${genreFilter}${yearFilter}&ordering=${ordering}&page_size=15&page=${rastgeleSayfa}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.results && data.results.length > 5) {
            // Veriyi işle
            const karisikSonuclar = data.results
                .sort(() => Math.random() - 0.5)
                .slice(0, 12);

            dinamikOyunlar = karisikSonuclar.map((o, i) => ({ 
                ad: o.name, 
                id: o.slug, 
                renk: markaRenkleri[i % 2] 
            }));
            
            carkiCiz();
            container.classList.remove('is-loading'); // Neon halkayı durdur

            if (typeof startSpinAudio === "function") startSpinAudio();

            // 2. Çark Dönüşü Animasyonu
            const donus = Math.floor(Math.random() * 360) + 2160; 
            mevcutDerece += donus;
            canvas.style.transform = `rotate(${mevcutDerece}deg)`;

            // 3. Çark Durduğunda (4 Saniye Sonra)
            setTimeout(() => {
                if (typeof stopSpinAudio === "function") stopSpinAudio();
                
                // UZAYI KADEMELİ YAVAŞLAT
                let yavaslatmaEfekti = setInterval(() => {
                    if (uzayHizi > 0.0005) {
                        uzayHizi -= 0.002;
                    } else {
                        uzayHizi = 0.0005;
                        clearInterval(yavaslatmaEfekti);
                    }
                }, 30);

                // Görsel Efektler (Sarsılma ve Konfeti Kaldırıldı)
                document.body.classList.add('flash-effect');
                canvas.classList.add('wheel-winner-active');
                
                setTimeout(() => {
                    document.body.classList.remove('flash-effect');
                }, 500);

                // Butonu ve Arayüzü Aktif Et
                spinBtn.disabled = false; 
                spinBtn.innerText = "ÇEVİR";
                
                // Kazananı Belirle
                const normalize = (mevcutDerece % 360);
                const index = Math.floor(((270 - normalize + 360) % 360) / (360 / dinamikOyunlar.length));
                
                detayGetir(dinamikOyunlar[index].id);
            }, 4000);

        } 
        else if (rastgeleSayfa > 1) {
            // Eğer rastgele sayfa boşsa 1. sayfayı dene (Rekürsif çağrı yerine direkt fonksiyon)
            return varsayilanSayfaIleDene(); 
        } 
        else {
            throw new Error("Oyun bulunamadı");
        }
    } catch (e) { 
     
        uzayHizi = 0.0005;
        container.classList.remove('is-loading');
        spinBtn.disabled = false; 
        spinBtn.innerText = "YENİDEN DENE";
        ozelHataGoster("Kriterlere uygun oyun bulunamadı.");
    }
}

async function varsayilanSayfaIleDene() {
    const genreFilter = genreSelect.value ? `&genres=${genreSelect.value}` : '';
    const yearFilter = yearSelect.value ? `&dates=${yearSelect.value}` : '';
    const url = `https://api.rawg.io/api/games?key=${API_KEY}&platforms=${platformSelect.value}${genreFilter}${yearFilter}&page_size=12&page=1`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if(data.results && data.results.length > 0) {
            dinamikOyunlar = data.results.map((o, i) => ({ 
                ad: o.name, 
                id: o.slug, 
                renk: markaRenkleri[i % 2] 
            }));
            carkiCiz();

            spinBtn.disabled = false;
            spinBtn.innerText = "ÇEVİR";
            ozelHataGoster("Sayfa 1'den veriler yüklendi, tekrar çevirin!");
        } else {
            ozelHataGoster("Maalesef hiç oyun bulunamadı.");
            spinBtn.disabled = false;
            spinBtn.innerText = "ÇEVİR";
        }
    } catch(e) {
        spinBtn.disabled = false;
        spinBtn.innerText = "ÇEVİR";
    }
}

function ozelHataGoster(mesaj) {
    const toast = document.getElementById('error-toast');
    if(toast) {
        const msgSpan = toast.querySelector('.error-msg');
        msgSpan.innerText = mesaj;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 4000);
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
                            ${game.platforms?.find(p => p.platform.id === 4)?.requirements?.minimum || "Sistem gereksinimi belirtilmemiş."}
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
        ozelHataGoster("Oyun detayları yüklenirken bir hata oluştu.");
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
