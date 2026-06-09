// ==========================================================================
// 🚀 パスワード撤廃＆初期化
// ==========================================================================
function vibrate() { if (navigator.vibrate) navigator.vibrate(15); }

let state = JSON.parse(localStorage.getItem('my_gacha_universe_state')) || {
    gachas: [{ id: 'default', title: 'はじまりのガチャ', cards: [], isLocked: false }], 
    currentGachaId: 'default',
    inventory: {},    
    stones: 300,      
    totalSpent: 0,
    loginDays: 0,
    lastLoginDate: "",
    tickets: { ssr: 0, ur: 0, le: 0 }, 
    partner: null,    
    appTheme: 'theme-stylish',
    splashTime: 1200,
    customColors: {
        'theme-stylish': { bg: '#f4f5f7', panel: 'rgba(255, 255, 255, 0.6)', accent: '#1d1d1f' },
        'theme-cute': { bg: '#fff5f5', panel: 'rgba(255, 255, 255, 0.85)', accent: '#ff85a1' },
        'theme-gaming': { bg: '#07070c', panel: 'rgba(10, 10, 20, 0.8)', accent: '#00ffcc' }
    }
};
let GAS_URL = localStorage.getItem('my_gacha_gas_url') || "";
let lastPullShareText = "";

// ==========================================================================
// 🚀 起動処理 & サプライズURL検知
// ==========================================================================
window.addEventListener('DOMContentLoaded', () => {
    applyCurrentThemeAndColors();

    const imgData = localStorage.getItem('my_gacha_welcome_img');
    const splashTime = state.splashTime || 1200;
    if (imgData) {
        document.getElementById('splash-default').classList.add('hidden');
        const customImg = document.getElementById('splash-custom');
        customImg.src = imgData;
        customImg.classList.remove('hidden');
    }
    
    setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) { splash.style.opacity = '0'; setTimeout(() => splash.remove(), 500); }
        checkSurpriseShare(); // スプラッシュ後にサプライズチェック
    }, splashTime);

    checkLoginBonus();
    updateUI();
    renderGachaSelectors();
    triggerPartnerSpeech(true); 
});

function saveLocal() {
    localStorage.setItem('my_gacha_universe_state', JSON.stringify(state));
    updateUI();
}

// ==========================================================================
// 🎨 カラーカスタマイズ制御エンジン（部位変更版）
// ==========================================================================
function applyCurrentThemeAndColors() {
    const theme = state.appTheme || 'theme-stylish';
    const themeSel = document.getElementById('theme-selector');
    if (themeSel) themeSel.value = theme;

    if (!state.customColors[theme]) {
        const defaults = {
            'theme-stylish': { bg: '#f4f5f7', panel: 'rgba(255, 255, 255, 0.6)', accent: '#1d1d1f' },
            'theme-cute': { bg: '#fff5f5', panel: 'rgba(255, 255, 255, 0.85)', accent: '#ff85a1' },
            'theme-gaming': { bg: '#07070c', panel: 'rgba(10, 10, 20, 0.8)', accent: '#00ffcc' }
        };
        state.customColors[theme] = defaults[theme] || defaults['theme-stylish'];
    }

    const colors = state.customColors[theme];
    const root = document.documentElement;
    root.style.setProperty('--bg-color', colors.bg);
    root.style.setProperty('--panel-bg', colors.panel);
    root.style.setProperty('--accent-color', colors.accent);
    
    // テキストカラーの自動調整（背景が暗ければ白文字に）
    const hexToLuma = (color) => {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substr(0, 2), 16);
        const g = parseInt(hex.substr(2, 2), 16);
        const b = parseInt(hex.substr(4, 2), 16);
        return [0.299 * r, 0.587 * g, 0.114 * b].reduce((a, b) => a + b) / 255;
    };
    root.style.setProperty('--text-color', hexToLuma(colors.bg) > 0.5 ? '#1d1d1f' : '#ffffff');

    const pickerBg = document.getElementById('custom-color-bg');
    const pickerPanel = document.getElementById('custom-color-panel');
    const pickerAccent = document.getElementById('custom-color-accent');
    
    // rgbaからhexへの簡易変換処理（カラーピッカー用）
    const rgbaToHex = (rgba) => {
        const match = rgba.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)/i);
        return (match && match.length === 4) ? "#" +
        ("0" + parseInt(match[1],10).toString(16)).slice(-2) +
        ("0" + parseInt(match[2],10).toString(16)).slice(-2) +
        ("0" + parseInt(match[3],10).toString(16)).slice(-2) : rgba;
    };

    if (pickerBg) pickerBg.value = rgbaToHex(colors.bg);
    if (pickerPanel) pickerPanel.value = rgbaToHex(colors.panel);
    if (pickerAccent) pickerAccent.value = rgbaToHex(colors.accent);
}

function updateCustomColor(type, value) {
    const theme = state.appTheme || 'theme-stylish';
    state.customColors[theme][type] = value;
    applyCurrentThemeAndColors();
    saveLocal();
}

function resetCurrentThemeColors() {
    vibrate();
    const theme = state.appTheme || 'theme-stylish';
    const defaults = {
        'theme-stylish': { bg: '#f4f5f7', panel: 'rgba(255, 255, 255, 0.6)', accent: '#1d1d1f' },
        'theme-cute': { bg: '#fff5f5', panel: 'rgba(255, 255, 255, 0.85)', accent: '#ff85a1' },
        'theme-gaming': { bg: '#07070c', panel: 'rgba(10, 10, 20, 0.8)', accent: '#00ffcc' }
    };
    state.customColors[theme] = { ...defaults[theme] };
    applyCurrentThemeAndColors();
    saveLocal();
    alert("このテーマの色を初期状態に戻しました！");
}

function changeAppTheme(themeName) {
    vibrate();
    state.appTheme = themeName;
    applyCurrentThemeAndColors();
    saveLocal();
}

// ==========================================================================
// 🎁 GASによるサプライズシェアシステム（超重要）
// ==========================================================================
function saveGasUrl() { 
    GAS_URL = document.getElementById('gas-url').value.trim(); 
    localStorage.setItem('my_gacha_gas_url', GAS_URL); 
    alert("☁️ GASのURLを保存しました。これでサプライズシェアが使えます！"); 
}

// シェアボタン押下時
if(document.getElementById('btn-share-gacha-gas')) {
    document.getElementById('btn-share-gacha-gas').addEventListener('click', async () => {
        vibrate();
        if(!GAS_URL) return alert("⚠️ 設定画面からGASのURLを登録してください！");
        
        const currentGacha = state.gachas.find(g => g.id === state.currentGachaId);
        if (!currentGacha || currentGacha.cards.length === 0) return alert("カードが1枚もありません！");
        
        document.getElementById('btn-share-gacha-gas').innerText = "⏳ 準備中...";
        
        const shareId = "share_" + Date.now();
        const payload = {
            action: "saveShare",
            shareId: shareId,
            gachaData: currentGacha
        };

        try {
            // POSTでGASにデータを送信（CORS許可されたGASを想定）
            const res = await fetch(GAS_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });
            const result = await res.json();
            
            if(result.status === "success") {
                const shareUrl = window.location.origin + window.location.pathname + "?surprise=" + shareId;
                navigator.clipboard.writeText(shareUrl).then(() => {
                    alert("🔗 サプライズURLをコピーしました！LINEで友達に送りましょう！\n\n" + shareUrl);
                }).catch(() => prompt("以下のURLをコピーして送ってください:", shareUrl));
            } else {
                alert("エラーが発生しました。GASの設定を確認してください。");
            }
        } catch(e) {
            alert("通信に失敗しました。GASのコードやCORS設定を確認してください。");
            console.error(e);
        } finally {
            document.getElementById('btn-share-gacha-gas').innerText = "🔗 シェア";
        }
    });
}

// サプライズURL検知
async function checkSurpriseShare() {
    const urlParams = new URLSearchParams(window.location.search);
    const surpriseId = urlParams.get('surprise');
    if (surpriseId && GAS_URL) {
        try {
            // GETでGASからデータを取得
            const res = await fetch(GAS_URL + "?action=getShare&shareId=" + surpriseId);
            const result = await res.json();
            
            if(result.status === "success" && result.data) {
                const importedGacha = result.data;
                document.getElementById('modal-surprise').classList.remove('hidden');
                
                document.getElementById('btn-surprise-open').onclick = () => {
                    vibrate();
                    // ガチャを保存してアクティブにする
                    importedGacha.id = 'imported_' + Date.now(); 
                    importedGacha.title = "🎁 " + importedGacha.title; 
                    importedGacha.isLocked = false; 
                    state.gachas.push(importedGacha); 
                    state.currentGachaId = importedGacha.id; 
                    
                    // 新規ガチャを引けるだけの石をプレゼント！
                    state.stones += 3000; 
                    saveLocal();
                    
                    // ガチャ画面へ強制ジャンプ
                    document.getElementById('modal-surprise').classList.add('hidden');
                    window.history.replaceState({}, document.title, window.location.pathname);
                    document.querySelector('.nav-btn[data-target="view-gacha"]').click();
                    
                    setTimeout(() => alert("✨ 石を3000個プレゼント！今すぐ引いてみよう！"), 500);
                };
            }
        } catch(e) {
            console.error("サプライズデータの取得に失敗しました", e);
        }
    }
}

// ==========================================================================
// 📱 タブ切り替え & その他UI
// ==========================================================================
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        vibrate();
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        
        document.getElementById(btn.dataset.target).classList.add('active');
        btn.classList.add('active');
        
        if (btn.dataset.target === 'view-collection') renderCollection();
        if (btn.dataset.target === 'view-admin') renderGachaSelectors();
        if (btn.dataset.target === 'view-gacha') {
            document.getElementById('btn-share-pull-result').classList.add('hidden');
            renderGachaScreen();
        }
    });
});

function checkLoginBonus() {
    const today = new Date().toLocaleDateString('ja-JP');
    if (state.lastLoginDate !== today) {
        state.lastLoginDate = today;
        state.loginDays += 1;
        state.stones += 300; 
        
        let bonusText = `💎 毎日ログインボーナス 300個 獲得！\n(通算 ${state.loginDays}日目)`;
        const panel = document.getElementById('login-bonus-panel');
        panel.innerHTML = `<div style="font-size:14px;font-weight:900;margin-bottom:5px;">🎁 本日のログインボーナス</div><p style="white-space:pre-wrap; font-size:12px; margin:0;">${bonusText}</p>`;
        panel.classList.remove('hidden');
        saveLocal();
        setTimeout(() => { confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } }); }, 600);
    }
}

function triggerPartnerSpeech(isInitial = false) {
    if (!isInitial) vibrate();
    const bubble = document.getElementById('home-message');
    if (!state.partner) {
        bubble.innerText = "図鑑からお気に入りのカードを『相棒』に選んでね！";
        return;
    }
    const currentGacha = state.gachas.find(g => g.id === state.partner.gachaId);
    if (!currentGacha) return;
    const card = currentGacha.cards.find(c => c.id === state.partner.cardId);
    if (!card) return;

    if (Math.random() > 0.5 || isInitial) {
        bubble.innerText = card.desc && card.desc !== "説明なし" ? `「${card.desc}」` : `私は「${card.name}」だよ！`;
    } else {
        bubble.innerText = "今日も最高の引きを見せてくれよな！";
    }
}

function updateUI() {
    document.getElementById('header-stones').innerText = `💎 ${state.stones}`;
    document.getElementById('login-days').innerText = state.loginDays;
    document.getElementById('total-spent-stones').innerText = state.totalSpent;
    
    if (state.gachas.length === 0) {
        document.getElementById('current-gacha-title').innerText = "ガチャがありません";
        document.getElementById('comp-percent').innerText = "0";
        document.getElementById('comp-fraction').innerText = "0 / 0";
        return;
    }

    const currentGacha = state.gachas.find(g => g.id === state.currentGachaId) || state.gachas[0];
    document.getElementById('current-gacha-title').innerText = currentGacha.title;

    if (currentGacha.cards.length > 0) {
        const inv = state.inventory[currentGacha.id] || {};
        const typesGot = Object.keys(inv).filter(cardId => inv[cardId] > 0).length;
        const total = currentGacha.cards.length;
        document.getElementById('comp-percent').innerText = Math.floor((typesGot / total) * 100);
        document.getElementById('comp-fraction').innerText = `${typesGot} / ${total}`;
    } else {
        document.getElementById('comp-percent').innerText = 0;
        document.getElementById('comp-fraction').innerText = `0 / 0`;
    }

    const partnerImg = document.getElementById('home-partner-img');
    const partnerStar = document.getElementById('home-partner-star');
    if (state.partner) {
        const pGacha = state.gachas.find(g => g.id === state.partner.gachaId);
        if (pGacha) {
            const pCard = pGacha.cards.find(c => c.id === state.partner.cardId);
            if (pCard) {
                partnerImg.src = pCard.img;
                partnerImg.classList.remove('hidden');
                if (((state.inventory[state.partner.gachaId] || {})[state.partner.cardId] || 0) >= 100) partnerStar.classList.remove('hidden');
                else partnerStar.classList.add('hidden');
            }
        }
    } else {
        partnerImg.src = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%23ccc'/><text x='50' y='55' font-size='30' text-anchor='middle'>❓</text></svg>";
        partnerStar.classList.add('hidden');
    }
}

function renderGachaScreen() {
    const currentGacha = state.gachas.find(g => g.id === state.currentGachaId);
    const statusText = document.getElementById('gacha-screen-status');
    const actionControls = document.getElementById('gacha-action-controls');

    if (!currentGacha) {
        statusText.innerText = "ガチャがありません";
        actionControls.innerHTML = `<p style="text-align:center;width:100%;font-size:12px;opacity:0.6;">⚙️「作る」タブからガチャを作成してね</p>`;
        return;
    }
    statusText.innerText = "最高レアを引き当てろ！";
    actionControls.innerHTML = `<button onclick="pullGacha(1)" class="btn btn-gacha">単発 (💎30)</button><button onclick="pullGacha(10)" class="btn btn-gacha-10">10連 (💎300)</button>`;
}

function pullGacha(times) {
    vibrate();
    const currentGacha = state.gachas.find(g => g.id === state.currentGachaId);
    if (!currentGacha || currentGacha.cards.length === 0) return alert("このガチャにはまだ景品がありません。⚙️「作る」から画像を登録してください！");

    const cost = times * 30;
    if (state.stones < cost) return alert("💎石が足りません！毎日のログボを待ってね！");
    state.stones -= cost;
    state.totalSpent += cost;

    const container = document.getElementById('gacha-result-container');
    container.innerHTML = "";
    if (!state.inventory[currentGacha.id]) state.inventory[currentGacha.id] = {};
    const inv = state.inventory[currentGacha.id];
    
    let highestRarity = 'C';
    let bestCardForShare = null;
    const rarityOrder = ['C', 'N', 'R', 'SR', 'SSR', 'UR', 'LE', 'LR', 'SLR'];

    for (let i = 0; i < times; i++) {
        let rand = Math.random() * 100;
        let selectedRarity = 'N';
        
        if (rand < 0.01) selectedRarity = 'SLR'; else if (rand < 0.05) selectedRarity = 'LR'; else if (rand < 0.2) selectedRarity = 'LE'; else if (rand < 0.7) selectedRarity = 'UR'; else if (rand < 4.5) selectedRarity = 'SSR'; else if (rand < 15.0) selectedRarity = 'SR'; else if (rand < 35.0) selectedRarity = 'R'; else if (rand < 85.0) selectedRarity = 'N'; else selectedRarity = 'C';

        let pool = currentGacha.cards.filter(c => c.rarity === selectedRarity);
        if (pool.length === 0) pool = currentGacha.cards; 

        let card = pool[Math.floor(Math.random() * pool.length)];
        inv[card.id] = (inv[card.id] || 0) + 1;
        
        if (rarityOrder.indexOf(selectedRarity) >= rarityOrder.indexOf(highestRarity)) {
            highestRarity = selectedRarity;
            bestCardForShare = card;
        }

        const cardDiv = document.createElement('div');
        cardDiv.className = `card ${card.rarity}`;
        let blueStarHtml = inv[card.id] >= 100 ? `<div class="blue-star-evolved"></div>` : '';
        cardDiv.innerHTML = `${blueStarHtml}<img src="${card.img}"><div class="card-rarity-tag">${card.rarity}</div>`;
        cardDiv.onclick = () => openModal(currentGacha.id, card.id);
        container.appendChild(cardDiv);
    }

    if (rarityOrder.indexOf(highestRarity) >= rarityOrder.indexOf('SSR')) {
        setTimeout(() => { confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); }, 200);
    }
    
    if (bestCardForShare) {
        lastPullShareText = `【MY GACHA MAKER】\n${times}連ガチャを引いて、\n${bestCardForShare.rarity}「${bestCardForShare.name}」を神引きしたよ！✨\n#ガチャメーカー`;
        document.getElementById('btn-share-pull-result').classList.remove('hidden');
    }

    saveLocal();
    renderGachaScreen();
}

function sharePullResult() {
    vibrate();
    navigator.clipboard.writeText(lastPullShareText).then(() => {
        alert("📋 結果をコピーしました！LINEやXでシェアしよう！\n\n" + lastPullShareText);
    }).catch(() => {
        prompt("以下のテキストをコピーしてください:", lastPullShareText);
    });
}

function renderCollection() {
    const currentGacha = state.gachas.find(g => g.id === state.currentGachaId);
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    
    if (!currentGacha || currentGacha.cards.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; opacity:0.5; margin-top:40px; font-weight:bold;">カードが1枚もありません</div>';
        return;
    }

    const sortType = document.getElementById('collection-sort-selector').value;
    const inv = state.inventory[currentGacha.id] || {};
    
    let sortedCards = [...currentGacha.cards];
    if (sortType === 'rarity') {
        const rarityOrder = { 'SLR':0, 'LR':1, 'LE':2, 'UR':3, 'SSR':4, 'SR':5, 'R':6, 'N':7, 'C':8 };
        sortedCards.sort((a, b) => rarityOrder[a.rarity] - rarityOrder[b.rarity]);
    } else {
        sortedCards.sort((a, b) => b.id - a.id);
    }

    sortedCards.forEach(card => {
        const count = inv[card.id] || 0;
        const div = document.createElement('div');
        
        if (count > 0) {
            div.className = `card ${card.rarity}`;
            let blueStarHtml = count >= 100 ? `<div class="blue-star-evolved"></div>` : '';
            div.innerHTML = `${blueStarHtml}<img src="${card.img}"><div class="card-rarity-tag">${card.rarity}</div>`;
            div.onclick = () => openModal(currentGacha.id, card.id);
        } else {
            div.className = `card`;
            div.innerHTML = `<div class="item-empty">???<br><span style="opacity:0.5;font-size:9px;">${card.rarity}</span></div>`;
        }
        grid.appendChild(div);
    });
}

function renderGachaSelectors() {
    const adminSel = document.getElementById('gacha-selector');
    const colSel = document.getElementById('collection-gacha-selector');
    if(!adminSel || !colSel) return;
    adminSel.innerHTML = ''; colSel.innerHTML = '';
    
    state.gachas.forEach(g => {
        const opt1 = document.createElement('option'); opt1.value = g.id; opt1.innerText = g.title + (g.isLocked ? " 🏆" : "");
        if(g.id === state.currentGachaId) opt1.selected = true; adminSel.appendChild(opt1);
        const opt2 = document.createElement('option'); opt2.value = g.id; opt2.innerText = g.title + (g.isLocked ? " 🏆" : "");
        if(g.id === state.currentGachaId) opt2.selected = true; colSel.appendChild(opt2);
    });
}

if(document.getElementById('gacha-selector')) {
    document.getElementById('gacha-selector').addEventListener('change', (e) => {
        state.currentGachaId = e.target.value; saveLocal();
    });
}
if(document.getElementById('collection-gacha-selector')) {
    document.getElementById('collection-gacha-selector').addEventListener('change', (e) => {
        state.currentGachaId = e.target.value; saveLocal(); renderCollection();
    });
}

if(document.getElementById('btn-create-new-gacha')) {
    document.getElementById('btn-create-new-gacha').addEventListener('click', () => {
        const title = prompt("新しいガチャのタイトルを入力してください:");
        if(title) {
            const newId = 'gacha_' + Date.now();
            state.gachas.unshift({ id: newId, title: title, cards: [], isLocked: false });
            state.currentGachaId = newId;
            saveLocal(); renderGachaSelectors(); alert(`「${title}」を作成しました！`);
        }
    });
}

if(document.getElementById('btn-delete-gacha')) {
    document.getElementById('btn-delete-gacha').addEventListener('click', () => {
        if(state.gachas.length === 0) return;
        const currentGacha = state.gachas.find(g => g.id === state.currentGachaId);
        if(confirm(`本当にガチャ「${currentGacha.title}」を削除しますか？\n（中のカードやデータもすべて消えます！）`)) {
            state.gachas = state.gachas.filter(g => g.id !== state.currentGachaId);
            delete state.inventory[state.currentGachaId];
            if(state.partner && state.partner.gachaId === state.currentGachaId) state.partner = null;
            
            if (state.gachas.length > 0) {
                state.currentGachaId = state.gachas[0].id;
            } else {
                state.currentGachaId = null;
            }
            saveLocal(); renderGachaSelectors();
            alert("ガチャを完全に削除しました。");
        }
    });
}

if(document.getElementById('btn-add-card')) {
    document.getElementById('btn-add-card').addEventListener('click', () => {
        vibrate();
        const file = document.getElementById('input-card-img').files[0];
        const name = document.getElementById('input-card-name').value.trim();
        const rarity = document.getElementById('input-card-rarity').value;
        const desc = document.getElementById('input-card-desc').value.trim();
        
        if(!file) return alert("画像を選択してください！");
        if(!name) return alert("名前を入力してください！");
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 240; 
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH; canvas.height = img.height * scaleSize;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.65);
                
                const currentGacha = state.gachas.find(g => g.id === state.currentGachaId);
                currentGacha.cards.push({ id: Date.now(), name: name, rarity: rarity, desc: desc || "説明なし", img: compressedBase64 });
                saveLocal(); alert(`🎉 「${name} (${rarity})」を実装しました！`);
                document.getElementById('input-card-img').value = ''; document.getElementById('input-card-name').value = ''; document.getElementById('input-card-desc').value = '';
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
}

let currentModalTarget = null;
function openModal(gachaId, cardId) {
    vibrate();
    const gacha = state.gachas.find(g => g.id === gachaId);
    const card = gacha.cards.find(c => c.id === cardId);
    const count = (state.inventory[gachaId] || {})[cardId] || 0;
    currentModalTarget = { gachaId, cardId };
    
    const rEl = document.getElementById('modal-card-rarity');
    rEl.innerText = card.rarity; rEl.className = `modal-rarity ${card.rarity}`;
    document.getElementById('modal-card-img').src = card.img;
    document.getElementById('modal-card-name').innerText = card.name;
    document.getElementById('modal-card-count').innerText = count;
    document.getElementById('modal-card-desc').innerText = card.desc;
    document.getElementById('modal-card-stars').className = count >= 100 ? "blue-star-evolved" : "";
    document.getElementById('modal-card-detail').classList.remove('hidden');
}

if(document.getElementById('btn-close-modal')) document.getElementById('btn-close-modal').addEventListener('click', () => document.getElementById('modal-card-detail').classList.add('hidden'));
if(document.getElementById('btn-set-partner')) {
    document.getElementById('btn-set-partner').addEventListener('click', () => {
        state.partner = currentModalTarget; saveLocal(); alert("相棒に設定しました！");
        document.getElementById('modal-card-detail').classList.add('hidden'); triggerPartnerSpeech(true);
    });
}