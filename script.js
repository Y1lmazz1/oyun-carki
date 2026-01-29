
const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-button');
const platformSelect = document.getElementById('platform-select');
const genreSelect = document.getElementById('genre-select');
const modal = document.getElementById('game-modal');
const modalBody = document.getElementById('modal-body');

let dinamikOyunlar = [];
let mevcutDerece = 0;
const merkez = 400;

// ÇARK SİSTEMİ
async function oyunlariTazeleVeDon() {
    spinBtn.disabled = true; 
    spinBtn.innerText = "YÜKLENİYOR...";
    canvas.style.boxShadow = "none";
    
    const randomPage = Math.floor(Math.random() * 10) + 1;
    const genreFilter = genreSelect.value ? `&genres=${genreSelect.value}` : '';
    const url = `https://api.rawg.io/api/games?key=${API_KEY}&platforms=${platformSelect.value}${genreFilter}&metacritic=70,100&page_size=16&page=${randomPage}`;
    
    try {
        const res = await fetch(url);
        const data = await res.json();
        if(!data.results || data.results.length < 2) throw new Error();

        const renkler = ["#ff4d4d", "#ffcc00", "#00ffcc", "#bc13fe", "#4dff4d", "#ff8c00", "#00bfff", "#e60000", "#ff66b2", "#33ff33", "#3333ff", "#ffff33", "#ff9933", "#9933ff", "#33ffff", "#ff3333"];
        dinamikOyunlar = data.results.slice(0, 16).map((o, i) => ({ 
            ad: o.name, id: o.slug, renk: renkler[i % renkler.length] 
        }));
        
        carkiCiz();
        spinBtn.innerText = "DÖNÜYOR...";
        const donus = Math.floor(Math.random() * 360) + 2160; 
        mevcutDerece += donus;
        canvas.style.transform = `rotate(${mevcutDerece}deg)`;

        setTimeout(() => {
            spinBtn.disabled = false; 
            spinBtn.innerText = "ÇEVİR";
            const normalize = (mevcutDerece % 360);
            const index = Math.floor(((270 - (normalize % 360) + 360) % 360) / (360 / dinamikOyunlar.length));
            
            canvas.style.boxShadow = `0 0 80px ${dinamikOyunlar[index].renk}`;
            detayGetir(dinamikOyunlar[index].id);
        }, 4000);
    } catch (e) { 
        spinBtn.innerText = "OYUN BULUNAMADI"; 
        spinBtn.disabled = false; 
    }
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
        ctx.arc(merkez, merkez, merkez, i * aci, (i + 1) * aci);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.2)";
        ctx.stroke();
        ctx.restore();
    });
}

// DETAY VE BAĞIMSIZ PANEL SİSTEMİ
// DETAY VE BAĞIMSIZ PANEL SİSTEMİ (GÜNCELLENMİŞ)
async function detayGetir(slug) {
    const [gameRes, screenRes, storeRes] = await Promise.all([
        fetch(`https://api.rawg.io/api/games/${slug}?key=${API_KEY}`),
        fetch(`https://api.rawg.io/api/games/${slug}/screenshots?key=${API_KEY}`),
        fetch(`https://api.rawg.io/api/games/${slug}/stores?key=${API_KEY}`)
    ]);
    
    const game = await gameRes.json();
    const screens = await screenRes.json();
    const stores = await storeRes.json();

    // Künye Bilgilerini Hazırla (Sol paneli doldurmak için)
    const genres = game.genres?.map(g => g.name).join(', ') || "Belirtilmemiş";
    const developers = game.developers?.map(d => d.name).join(', ') || "Belirtilmemiş";
    const esrb = game.esrb_rating ? game.esrb_rating.name : "Genel İzleyici";

    // PC Gereksinimlerini Ayıkla
    let pcRequirements = "Teknik detay bulunamadı.";
    if (game.platforms) {
        const pc = game.platforms.find(p => p.platform.id === 4);
        if (pc?.requirements?.minimum) pcRequirements = pc.requirements.minimum;
    }

    // Çeviri işlemi (Ekonomik ve Hata Korumalı)
    let desc = game.description_raw || "Açıklama mevcut değil.";
    try {
        const t = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(desc.substring(0, 450))}&langpair=en|tr`);
        const td = await t.json();
        if (td.responseData && td.responseData.translatedText && !td.responseData.translatedText.includes("MYMEMORY WARNING")) {
            desc = td.responseData.translatedText;
        }
    } catch(e) { console.error("Çeviri hatası:", e); }

    const galleryHtml = screens.results.slice(0, 4).map(img => 
        `<img src="${img.image}" onclick="resmiEkranaAc(this.src)" style="cursor:zoom-in; border-radius:8px; transition:0.3s; width:100%;">`
    ).join('');

    const storeHtml = stores.results.slice(0, 4).map(s => {
        let icon = "fa-solid fa-cart-shopping", className = "", storeName = "Mağaza";
        switch(s.store_id) {
            case 1: icon = "fa-brands fa-steam"; className = "steam"; storeName = "Steam"; break;
            case 3: icon = "fa-brands fa-playstation"; className = "playstation"; storeName = "PlayStation"; break;
            case 7: icon = "fa-brands fa-xbox"; className = "xbox"; storeName = "Xbox"; break;
            case 6: icon = "fa-brands fa-nintendo-switch"; className = "nintendo"; storeName = "Nintendo"; break;
            case 11: icon = "fa-solid fa-bag-shopping"; className = "epic"; storeName = "Epic Games"; break;
            case 2: icon = "fa-brands fa-microsoft"; className = "microsoft"; storeName = "MS Store"; break;
        }
        return `<a href="${s.url}" target="_blank" class="store-btn ${className}"><i class="${icon}"></i><span>${storeName}</span></a>`;
    }).join('');

    // YENİ MODAL TASARIMI
    modalBody.innerHTML = `
        <div class="modal-wrapper" style="display: flex; gap: 25px; align-items: flex-start; max-width: 1300px; width: 95%; margin: auto;">
            
            <div class="side-panel independent-card" style="flex: 0 0 320px; background: rgba(15, 23, 42, 0.95); border: 1px solid var(--neon-blue); border-radius: 20px; padding: 25px; position: sticky; top: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
                
                <div class="panel-header" style="color:var(--neon-blue); font-weight:bold; margin-bottom:15px; font-size:0.9rem;">
                    <i class="fa-solid fa-circle-info"></i> OYUN KÜNYESİ
                </div>
                <div style="font-size:0.85rem; color:#ccc; line-height:1.8; margin-bottom:25px; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:15px;">
                    <p><b>Tür:</b> ${genres}</p>
                    <p><b>Geliştirici:</b> ${developers}</p>
                    <p><b>Yaş Sınırı:</b> ${esrb}</p>
                </div>

                <div class="panel-header" style="color:var(--neon-blue); font-weight:bold; margin-bottom:15px; font-size:0.9rem;">
                    <i class="fa-solid fa-microchip"></i> SİSTEM GEREKSİNİMLERİ
                </div>
                <div style="font-size:0.8rem; color:#aaa; line-height:1.6; white-space: pre-line;">
                    ${pcRequirements}
                </div>
            </div>

            <div class="main-content-stack" style="flex: 1; display: flex; flex-direction: column; gap: 20px;">
                
                <div class="independent-card" style="background: rgba(15, 23, 42, 0.9); border-radius: 20px; padding: 25px; position: relative; border: 1px solid rgba(255,255,255,0.05);">
                    <span class="close-btn" onclick="modalKapat()" style="position: absolute; right: 25px; top: 15px; font-size:30px; cursor:pointer; color:#fff;">&times;</span>
                    <img src="${game.background_image}" class="main-img-top" style="width:100%; height:350px; object-fit:cover; border-radius:15px; margin-bottom:20px; border: 1px solid rgba(255,255,255,0.1);">
                    <h2 style="color:var(--neon-blue); font-size: 2.2rem; margin:0; text-transform: uppercase; letter-spacing: 1px;">${game.name}</h2>
                    <div style="margin-top:15px; display:flex; gap:20px; font-size:0.9rem; color:#999; align-items:center;">
                        <span><i class="fa-solid fa-clock"></i> ${game.playtime || "10+"} Saat</span>
                        <span><i class="fa-solid fa-calendar"></i> ${game.released || "N/A"}</span>
                        <div style="background:rgba(0,242,255,0.1); padding:5px 12px; border-radius:8px; border:1px solid var(--neon-blue); color:var(--neon-blue); font-weight:bold;">
                            ⭐ Metacritic: ${game.metacritic || "75"}
                        </div>
                    </div>
                </div>

                <div style="display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px;">
                    
                    <div class="independent-card" style="background: rgba(15, 23, 42, 0.9); border-radius: 20px; padding: 25px; border: 1px solid rgba(255,255,255,0.05);">
                        <div class="panel-header" style="color:var(--neon-blue); font-size:0.9rem; font-weight:bold; margin-bottom:15px; text-transform:uppercase;">OYUN HAKKINDA</div>
                        <p style="font-size:0.95rem; color:#ccc; line-height:1.7;">${desc}</p>
                        
                        <div class="panel-header" style="color:var(--neon-blue); font-size:0.9rem; font-weight:bold; margin:30px 0 15px 0; text-transform:uppercase;">MAĞAZALAR</div>
                        <div class="store-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                            ${storeHtml}
                        </div>
                    </div>

                    <div class="independent-card" style="background: rgba(15, 23, 42, 0.9); border-radius: 20px; padding: 25px; border: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column;">
                        <div class="panel-header" style="color:var(--neon-blue); font-size:0.9rem; font-weight:bold; margin-bottom:15px; text-transform:uppercase;">EKRAN GÖRÜNTÜLERİ</div>
                        <div class="gallery-mini" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom:25px;">
                            ${galleryHtml}
                        </div>
                        <a href="https://www.youtube.com/results?search_query=${game.name}+trailer" target="_blank" class="trailer-btn" style="background:#e60000; color:white; padding:18px; border-radius:12px; text-align:center; text-decoration:none; font-weight:bold; margin-top:auto; transition: 0.3s; display: block;">
                            <i class="fa-brands fa-youtube"></i> FRAGMANI İZLE
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
    modal.style.display = "flex";
}

// GÖRSEL BÜYÜTME
function resmiEkranaAc(src) {
    const overlay = document.createElement('div');
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.95); z-index:2000; display:flex; justify-content:center; align-items:center; cursor:zoom-out; backdrop-filter:blur(10px);";
    overlay.innerHTML = `<img src="${src}" style="max-width:90%; max-height:90%; border-radius:10px; border:2px solid var(--neon-blue);">`;
    overlay.onclick = () => overlay.remove();
    document.body.appendChild(overlay);
}

function modalKapat() { modal.style.display = "none"; }
spinBtn.addEventListener('click', oyunlariTazeleVeDon);
window.onclick = (e) => { if (e.target == modal) modalKapat(); };

oyunlariTazeleVeDon();