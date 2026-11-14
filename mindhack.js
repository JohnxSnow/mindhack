/**
 * PROJECT://MIND_HACK v2.0 - Client Engine & Story Card Generator
 * Developer: Zhiyar Hemn (ژیار هێمن)
 * Features: Speedrun Timer, Leaderboard API, Canvas Story Certificate (1080x1920)
 */

class MindHackGame {
    constructor() {
        this.currentLevel = 1;
        this.totalLevels = 15;
        this.isSoundEnabled = true;
        this.audioCtx = null;
        this.isVerifying = false;
        this.isBackendOnline = false;

        // Player Identity & Stored Name
        this.playerName = "";
        try {
            this.playerName = localStorage.getItem("mindhack_player_name") || "";
        } catch (e) {}

        // Speedrun Stopwatch (started when user launches from Lobby)
        this.startTime = null;
        this.timerInterval = null;
        this.finalTimeFormatted = "00:00";

        this.initDOM();
        this.initMatrixCanvas();
        this.initEvents();
        this.initTools();
        this.checkServerStatus();
        this.fetchLeaderboard();

        // If player already has a name stored, pre-fill and update badges
        if (this.playerName && this.playerNameIntro) {
            this.playerNameIntro.value = this.playerName;
            this.updatePlayerNameDisplays(this.playerName);
        }

        // Show Intro screen first
        this.showIntro();

        // Preload Level 1
        this.loadLevel(1);
    }

    initDOM() {
        // Screens
        this.introScreen = document.getElementById("intro-screen");
        this.lobbyScreen = document.getElementById("lobby-screen");
        this.gameStage = document.getElementById("game-stage");

        // Player Registration & Name Elements
        this.playerNameIntro = document.getElementById("player-name-intro");
        this.playerNameError = document.getElementById("player-name-error");
        this.lobbyPlayerNameDisplay = document.getElementById("lobby-player-name-display");
        this.hudPlayerNameDisplay = document.getElementById("hud-player-name-display");
        this.victoryPlayerCongrats = document.getElementById("victory-player-congrats");
        this.sealPlayerNameDisplay = document.getElementById("seal-player-name-display");
        this.sealTokenBadge = document.getElementById("seal-token-badge");

        // Intro & Lobby interactive elements
        this.btnEnterLobby = document.getElementById("btn-enter-lobby");
        this.btnStartGameMain = document.getElementById("btn-start-game-main");
        this.btnReturnLobby = document.getElementById("btn-return-lobby");
        this.btnSoundToggleLobby = document.getElementById("btn-sound-toggle-lobby");
        this.btnDevInfoLobby = document.getElementById("btn-dev-info-lobby");
        this.lobbyLeaderboardBody = document.getElementById("lobby-leaderboard-body");
        this.lobbyServerStatus = document.getElementById("lobby-server-status");

        // Game Workspace elements
        this.terminalScreen = document.getElementById("terminal-screen");
        this.cyberInput = document.getElementById("cyber-input");
        this.btnSubmit = document.getElementById("btn-submit-code");
        this.stageTitle = document.getElementById("stage-title");
        this.securityBadge = document.getElementById("security-badge");
        this.currentLevelDisplay = document.getElementById("current-level-display");
        this.levelDifficultyBadge = document.getElementById("level-difficulty-badge");
        this.progressBarFill = document.getElementById("progress-bar-fill");
        this.clearanceTag = document.getElementById("clearance-tag");
        this.serverStatus = document.getElementById("server-status");
        this.inputBarContainer = document.getElementById("input-bar-container");
        this.speedrunTimerEl = document.getElementById("speedrun-timer");

        // Tool buttons
        this.btnToolHex = document.getElementById("btn-tool-hex");
        this.btnToolBase64 = document.getElementById("btn-tool-base64");
        this.btnToolMorse = document.getElementById("btn-tool-morse");
        this.btnToolInspect = document.getElementById("btn-tool-inspect");

        // Leaderboard elements
        this.btnOpenLeaderboard = document.getElementById("btn-open-leaderboard");
        this.modalLeaderboard = document.getElementById("modal-leaderboard");
        this.btnCloseLeaderboard = document.getElementById("btn-close-leaderboard");
        this.leaderboardBody = document.getElementById("leaderboard-body");

        // Modals
        this.modalHex = document.getElementById("modal-hex");
        this.btnCloseHex = document.getElementById("btn-close-hex");
        this.hexInput = document.getElementById("hex-input");
        this.btnRunHex = document.getElementById("btn-run-hex");
        this.hexResult = document.getElementById("hex-result");

        this.modalBase64 = document.getElementById("modal-base64");
        this.btnCloseBase64 = document.getElementById("btn-close-base64");
        this.base64Input = document.getElementById("base64-input");
        this.btnRunBase64 = document.getElementById("btn-run-base64");
        this.base64Result = document.getElementById("base64-result");

        this.modalMorse = document.getElementById("modal-morse");
        this.btnCloseMorse = document.getElementById("btn-close-morse");

        this.modalInspector = document.getElementById("modal-inspector");
        this.virtualCodeView = document.getElementById("virtual-code-view");
        this.btnCloseInspector = document.getElementById("btn-close-inspector");

        this.modalDev = document.getElementById("modal-dev");
        this.btnDevInfo = document.getElementById("btn-dev-info");
        this.btnCloseDev = document.getElementById("btn-close-dev");

        // Victory Elements
        this.modalVictory = document.getElementById("modal-victory");
        this.finalVictoryToken = document.getElementById("final-victory-token");
        this.finalTimeDisplay = document.getElementById("final-time-display");
        this.btnCopyToken = document.getElementById("btn-copy-token");
        this.btnClaimWhatsApp = document.getElementById("btn-claim-whatsapp");

        this.solverNameInput = document.getElementById("solver-name-input");
        this.btnSubmitLeaderboard = document.getElementById("btn-submit-leaderboard");
        this.claimResultMsg = document.getElementById("claim-result-msg");
        this.btnDownloadStoryCard = document.getElementById("btn-download-story-card");
        this.btnVictoryReturnLobby = document.getElementById("btn-victory-return-lobby");
        this.storyCanvas = document.getElementById("story-card-canvas");

        this.btnSoundToggle = document.getElementById("btn-sound-toggle");
        this.soundIcon = document.getElementById("sound-icon");
    }

    // =========================================================================
    // SCREEN NAVIGATION, PLAYER IDENTITY & AUDIO TOGGLE
    // =========================================================================
    showIntro() {
        if (this.introScreen) this.introScreen.style.display = "flex";
        if (this.lobbyScreen) this.lobbyScreen.style.display = "none";
        if (this.gameStage) this.gameStage.style.display = "none";
    }

    handleLobbyEntry() {
        const rawName = this.playerNameIntro ? this.playerNameIntro.value.trim() : "";
        if (!rawName) {
            if (this.playerNameIntro) {
                this.playerNameIntro.classList.add("input-error");
                setTimeout(() => this.playerNameIntro.classList.remove("input-error"), 600);
                this.playerNameIntro.focus();
            }
            if (this.playerNameError) {
                this.playerNameError.style.display = "flex";
            }
            this.playErrorBuzz();
            return;
        }

        if (this.playerNameError) {
            this.playerNameError.style.display = "none";
        }

        this.playerName = rawName;
        try {
            localStorage.setItem("mindhack_player_name", rawName);
        } catch (e) {}

        this.updatePlayerNameDisplays(rawName);
        this.showLobby();
    }

    updatePlayerNameDisplays(name) {
        if (this.lobbyPlayerNameDisplay) this.lobbyPlayerNameDisplay.innerText = name;
        if (this.hudPlayerNameDisplay) this.hudPlayerNameDisplay.innerText = name;
        if (this.sealPlayerNameDisplay) this.sealPlayerNameDisplay.innerText = name;
        if (this.solverNameInput) this.solverNameInput.value = name;
    }

    showLobby() {
        if (this.modalVictory) this.modalVictory.style.display = "none";
        if (this.introScreen) this.introScreen.style.display = "none";
        if (this.lobbyScreen) this.lobbyScreen.style.display = "flex";
        if (this.gameStage) this.gameStage.style.display = "none";
        this.fetchLeaderboard();
        this.playClickBeep();
    }

    startGameplay() {
        if (!this.playerName) {
            this.showIntro();
            if (this.playerNameIntro) {
                this.playerNameIntro.focus();
                if (this.playerNameError) this.playerNameError.style.display = "flex";
            }
            this.playErrorBuzz();
            return;
        }

        if (this.modalVictory) this.modalVictory.style.display = "none";
        if (this.introScreen) this.introScreen.style.display = "none";
        if (this.lobbyScreen) this.lobbyScreen.style.display = "none";
        if (this.gameStage) {
            this.gameStage.style.display = "flex";
            this.gameStage.style.flexDirection = "column";
        }

        if (!this.currentLevel || this.currentLevel >= 15) {
            this.currentLevel = 1;
            this.startTime = null;
        }

        if (!this.startTime) {
            this.startSpeedrunTimer();
        }

        // Render current level fresh to ensure full height and layout
        this.loadLevel(this.currentLevel || 1);

        if (this.cyberInput) {
            this.cyberInput.focus();
        }
        this.playSuccessBeep();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    toggleSound() {
        this.isSoundEnabled = !this.isSoundEnabled;
        const iconClass = this.isSoundEnabled ? "fa-solid fa-volume-high" : "fa-solid fa-volume-xmark";
        if (this.soundIcon) this.soundIcon.className = iconClass;
        if (this.btnSoundToggleLobby) {
            const lobbyIcon = this.btnSoundToggleLobby.querySelector("i");
            if (lobbyIcon) lobbyIcon.className = iconClass;
        }
        this.playClickBeep();
    }

    initEvents() {
        this.btnSubmit.addEventListener("click", () => this.handleCodeSubmission());
        this.cyberInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") this.handleCodeSubmission();
        });

        // Navigation between Intro, Lobby, and Game
        if (this.btnEnterLobby) {
            this.btnEnterLobby.addEventListener("click", () => this.handleLobbyEntry());
        }
        if (this.playerNameIntro) {
            this.playerNameIntro.addEventListener("keydown", (e) => {
                if (e.key === "Enter") this.handleLobbyEntry();
            });
            this.playerNameIntro.addEventListener("input", () => {
                if (this.playerNameError && this.playerNameIntro.value.trim()) {
                    this.playerNameError.style.display = "none";
                }
            });
        }
        if (this.btnStartGameMain) {
            this.btnStartGameMain.addEventListener("click", () => this.startGameplay());
        }
        if (this.btnReturnLobby) {
            this.btnReturnLobby.addEventListener("click", () => this.showLobby());
        }

        // Sound toggles
        if (this.btnSoundToggle) {
            this.btnSoundToggle.addEventListener("click", () => this.toggleSound());
        }
        if (this.btnSoundToggleLobby) {
            this.btnSoundToggleLobby.addEventListener("click", () => this.toggleSound());
        }

        // Dev info modals
        if (this.btnDevInfo) {
            this.btnDevInfo.addEventListener("click", () => {
                this.modalDev.style.display = "flex";
                this.playClickBeep();
            });
        }
        if (this.btnDevInfoLobby) {
            this.btnDevInfoLobby.addEventListener("click", () => {
                this.modalDev.style.display = "flex";
                this.playClickBeep();
            });
        }

        // Leaderboard
        this.btnOpenLeaderboard.addEventListener("click", () => {
            this.fetchLeaderboard();
            this.modalLeaderboard.style.display = "flex";
            this.playClickBeep();
        });
        this.btnCloseLeaderboard.addEventListener("click", () => this.modalLeaderboard.style.display = "none");

        // Tools
        this.btnToolHex.addEventListener("click", () => {
            this.modalHex.style.display = "flex";
            this.playClickBeep();
        });
        this.btnCloseHex.addEventListener("click", () => this.modalHex.style.display = "none");

        this.btnToolBase64.addEventListener("click", () => {
            this.modalBase64.style.display = "flex";
            this.playClickBeep();
        });
        this.btnCloseBase64.addEventListener("click", () => this.modalBase64.style.display = "none");

        this.btnToolMorse.addEventListener("click", () => {
            this.modalMorse.style.display = "flex";
            this.playClickBeep();
        });
        this.btnCloseMorse.addEventListener("click", () => this.modalMorse.style.display = "none");

        this.btnToolInspect.addEventListener("click", () => {
            this.renderVirtualSource();
            this.modalInspector.style.display = "flex";
            this.playClickBeep();
        });
        this.btnCloseInspector.addEventListener("click", () => this.modalInspector.style.display = "none");

        this.btnDevInfo.addEventListener("click", () => {
            this.modalDev.style.display = "flex";
            this.playClickBeep();
        });
        this.btnCloseDev.addEventListener("click", () => this.modalDev.style.display = "none");

        // Copy Token
        this.btnCopyToken.addEventListener("click", () => {
            navigator.clipboard.writeText(this.finalVictoryToken.innerText);
            this.btnCopyToken.innerHTML = `<i class="fa-solid fa-check"></i> کۆپیکرا!`;
            setTimeout(() => {
                this.btnCopyToken.innerHTML = `<i class="fa-solid fa-copy"></i> کۆپیکردنی کۆد`;
            }, 2000);
        });

        // Submit to Leaderboard
        this.btnSubmitLeaderboard.addEventListener("click", () => this.submitLeaderboardClaim());

        // Download Story Card
        this.btnDownloadStoryCard.addEventListener("click", () => this.generateAndDownloadStoryCard());

        // Return to Lobby from Victory Modal
        if (this.btnVictoryReturnLobby) {
            this.btnVictoryReturnLobby.addEventListener("click", () => {
                if (this.modalVictory) this.modalVictory.style.display = "none";
                this.currentLevel = 1;
                this.startTime = null;
                this.showLobby();
            });
        }

        // Backdrop click
        window.addEventListener("click", (e) => {
            if (e.target === this.modalLeaderboard) this.modalLeaderboard.style.display = "none";
            if (e.target === this.modalHex) this.modalHex.style.display = "none";
            if (e.target === this.modalBase64) this.modalBase64.style.display = "none";
            if (e.target === this.modalMorse) this.modalMorse.style.display = "none";
            if (e.target === this.modalInspector) this.modalInspector.style.display = "none";
            if (e.target === this.modalDev) this.modalDev.style.display = "none";
        });
    }

    initTools() {
        this.btnRunHex.addEventListener("click", () => {
            const raw = this.hexInput.value.trim().replace(/\s+/g, '');
            let str = '';
            for (let i = 0; i < raw.length; i += 2) {
                str += String.fromCharCode(parseInt(raw.substr(i, 2), 16));
            }
            this.hexResult.innerText = `ئەنجام: ${str || "نەناسراو"}`;
        });

        this.btnRunBase64.addEventListener("click", () => {
            try {
                const decoded = atob(this.base64Input.value.trim());
                this.base64Result.innerText = `ئەنجام: ${decoded}`;
            } catch (e) {
                this.base64Result.innerText = "هەڵە: کۆدی Base64 نادروستە!";
            }
        });
    }

    // =========================================================================
    // SPEEDRUN STOPWATCH
    // =========================================================================
    startSpeedrunTimer() {
        this.startTime = Date.now();
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(() => {
            const diff = Math.floor((Date.now() - this.startTime) / 1000);
            const m = Math.floor(diff / 60);
            const s = diff % 60;
            this.finalTimeFormatted = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            if (this.speedrunTimerEl) {
                this.speedrunTimerEl.innerText = this.finalTimeFormatted;
            }
        }, 1000);
    }

    stopSpeedrunTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    // =========================================================================
    // CLOUD DATABASE & LEADERBOARD SYNC (Firebase & Live Cloud DB)
    // =========================================================================
    getCloudEndpoints() {
        return {
            firebaseUrl: window.FIREBASE_DB_URL || localStorage.getItem('mh_firebase_url') || "https://mindhack-5e48a-default-rtdb.firebaseio.com/leaderboard.json",
            cloudDbUrl: "https://api.restful-api.dev/objects/ff808181a09d98f701a1d8fc7ca0274b"
        };
    }

    async fetchLeaderboard() {
        const loadingHtml = `<tr><td colspan="5" style="text-align:center; padding:18px; color:var(--text-muted);">لە کاتی بارکردندایە...</td></tr>`;
        if (this.leaderboardBody) this.leaderboardBody.innerHTML = loadingHtml;
        if (this.lobbyLeaderboardBody) this.lobbyLeaderboardBody.innerHTML = loadingHtml;

        const { firebaseUrl, cloudDbUrl } = this.getCloudEndpoints();
        let fetchedList = null;

        // 1. Try Firebase if configured
        if (firebaseUrl) {
            try {
                const url = firebaseUrl.endsWith('.json') ? firebaseUrl : `${firebaseUrl.replace(/\/+$/, '')}/leaderboard.json`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    if (data && typeof data === 'object') {
                        fetchedList = Array.isArray(data) ? data : Object.values(data);
                    }
                }
            } catch (e) {}
        }

        // 2. Try Live Cloud DB Endpoint (Global & Persistent across all devices)
        if (!fetchedList || fetchedList.length === 0) {
            try {
                const res = await fetch(cloudDbUrl);
                if (res.ok) {
                    const json = await res.json();
                    if (json && json.data && Array.isArray(json.data.players)) {
                        fetchedList = json.data.players;
                    }
                }
            } catch (e) {}
        }

        // 3. Try Local Serverless API (/api/leaderboard)
        if (!fetchedList || fetchedList.length === 0) {
            try {
                const res = await fetch('/api/leaderboard');
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        fetchedList = data;
                    }
                }
            } catch (e) {}
        }

        // 4. LocalStorage as resilient client cache
        let localList = [];
        try {
            localList = JSON.parse(localStorage.getItem('mh_local_leaderboard') || '[]');
        } catch (err) { localList = []; }

        const defaultList = [
            { rank: 1, name: "سەرکەوت (Sarkawt)", time: "14:22", date: "2026-11-12", token: "MH-MASTER-15-ALPHA-ZH" },
            { rank: 2, name: "ڕەوەند (Rawand)", time: "19:45", date: "2026-11-13", token: "MH-MASTER-15-BETA-ZH" }
        ];

        let combined = [...(fetchedList || []), ...localList];
        if (combined.length === 0) {
            combined = defaultList;
        }

        const seen = new Set();
        const unique = [];
        for (const item of combined) {
            const key = item.token || `${item.name}_${item.time}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(item);
            }
        }

        const toSec = (t) => {
            const parts = (t || '99:99').split(':').map(Number);
            if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
            if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
            return 99999;
        };

        unique.sort((a, b) => toSec(a.time) - toSec(b.time));
        unique.forEach((entry, idx) => entry.rank = idx + 1);

        this.renderLeaderboardTable(unique);
    }

    async loadLeaderboard() {
        return this.fetchLeaderboard();
    }

    async submitLeaderboardClaim() {
        const name = (this.solverNameInput ? this.solverNameInput.value.trim() : "") || this.playerName || "MASTER HACKER";
        const time = this.finalTimeFormatted || "00:00";
        const token = (this.finalVictoryToken ? this.finalVictoryToken.innerText.trim() : "") || `MH-MASTER-15-${Math.floor(1000 + Math.random() * 9000)}-ZH`;

        if (this.btnSubmitLeaderboard) {
            this.btnSubmitLeaderboard.disabled = true;
            this.btnSubmitLeaderboard.innerText = "تۆمارکرا";
            this.btnSubmitLeaderboard.style.display = "none";
        }

        const newEntry = {
            name: name,
            time: time,
            date: new Date().toISOString().split('T')[0],
            token: token
        };

        // 1. Always save to LocalStorage immediately
        try {
            let list = JSON.parse(localStorage.getItem('mh_local_leaderboard') || '[]');
            if (!list.some(entry => entry.token === token || (entry.name === name && entry.time === time))) {
                list.push(newEntry);
                localStorage.setItem('mh_local_leaderboard', JSON.stringify(list));
            }
        } catch (e) {}

        const { firebaseUrl, cloudDbUrl } = this.getCloudEndpoints();

        // 2. Save to Firebase if configured
        if (firebaseUrl) {
            try {
                const url = firebaseUrl.endsWith('.json') ? firebaseUrl : `${firebaseUrl.replace(/\/+$/, '')}/leaderboard.json`;
                await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newEntry)
                });
            } catch (e) {}
        }

        // 3. Save to Global Cloud DB (ensures persistent global ranking on all phones/PCs)
        try {
            const getRes = await fetch(cloudDbUrl);
            let currentPlayers = [];
            if (getRes.ok) {
                const json = await getRes.json();
                if (json && json.data && Array.isArray(json.data.players)) {
                    currentPlayers = json.data.players;
                }
            }

            if (!currentPlayers.some(e => e.token === token || (e.name === name && e.time === time))) {
                currentPlayers.push(newEntry);
                const toSec = (t) => {
                    const parts = (t || '99:99').split(':').map(Number);
                    if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
                    if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
                    return 99999;
                };
                currentPlayers.sort((a, b) => toSec(a.time) - toSec(b.time));
                currentPlayers.forEach((e, idx) => e.rank = idx + 1);

                await fetch(cloudDbUrl, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: 'MINDHACK_LEADERBOARD',
                        data: { players: currentPlayers }
                    })
                });
            }
        } catch (e) {}

        // 4. Try submitting to Server API if online
        try {
            await fetch('/api/claim', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEntry)
            });
        } catch (e) {}

        // 5. Update feedback UI in modal
        if (this.claimResultMsg) {
            this.claimResultMsg.innerHTML = `<span style="color:#00ff66; font-weight:700;"><i class="fa-solid fa-circle-check"></i> ناوت [${name}] بە کاتی [${time}] لە داتابەیسی سەرهێڵ (Cloud) تۆمار کرا!</span>`;
        }

        // 6. Update tables
        await this.fetchLeaderboard();
    }

    // =========================================================================
    // HIGH-RES INSTAGRAM / SNAPCHAT STORY CERTIFICATE GENERATOR (1080x1920 PNG)
    // =========================================================================
    generateAndDownloadStoryCard() {
        const canvas = this.storyCanvas;
        const ctx = canvas.getContext('2d');
        const solverName = this.playerName || (this.solverNameInput ? this.solverNameInput.value.trim() : "") || "MASTER HACKER";
        const timeTaken = this.finalTimeFormatted;
        const token = this.finalVictoryToken.innerText;

        // Background: Deep Carbon Cyberpunk
        ctx.fillStyle = "#04070b";
        ctx.fillRect(0, 0, 1080, 1920);

        // Matrix Grid background lines
        ctx.strokeStyle = "rgba(0, 255, 102, 0.06)";
        ctx.lineWidth = 2;
        for (let x = 0; x < 1080; x += 60) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, 1920);
            ctx.stroke();
        }
        for (let y = 0; y < 1920; y += 60) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(1080, y);
            ctx.stroke();
        }

        // Glowing Borders
        ctx.strokeStyle = "#00ff66";
        ctx.lineWidth = 14;
        ctx.shadowColor = "#00ff66";
        ctx.shadowBlur = 35;
        ctx.strokeRect(60, 60, 960, 1800);
        ctx.shadowBlur = 0; // Reset

        // Header: Brand Title
        ctx.fillStyle = "#00e5ff";
        ctx.font = "bold 44px 'Share Tech Mono', monospace";
        ctx.textAlign = "center";
        ctx.fillText("PROJECT://MIND_HACK v2.0", 540, 240);

        ctx.fillStyle = "#ffb700";
        ctx.font = "bold 32px 'Share Tech Mono', monospace";
        ctx.fillText("OFFICIAL VERIFIED CERTIFICATE", 540, 300);

        // Trophy / Icon Emblem
        ctx.fillStyle = "rgba(0, 255, 102, 0.12)";
        ctx.beginPath();
        ctx.arc(540, 480, 110, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#00ff66";
        ctx.lineWidth = 6;
        ctx.stroke();

        ctx.fillStyle = "#00ff66";
        ctx.font = "bold 80px sans-serif";
        ctx.fillText("🏆", 540, 510);

        // Kurdish Title
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px 'Vazirmatn', sans-serif";
        ctx.fillText("شایەتمانیی هاکەری بلیمەت", 540, 680);

        ctx.fillStyle = "#9ca3af";
        ctx.font = "36px 'Vazirmatn', sans-serif";
        ctx.fillText("ئەم بڕوانامەیە دەیسەلمێنێت کە", 540, 750);

        // Solver Name (Big Glowing)
        ctx.fillStyle = "#00ff66";
        ctx.font = "bold 84px 'Vazirmatn', sans-serif";
        ctx.shadowColor = "#00ff66";
        ctx.shadowBlur = 25;
        ctx.fillText(solverName, 540, 870);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#ffffff";
        ctx.font = "40px 'Vazirmatn', sans-serif";
        ctx.fillText("توانیویەتی تەواوی ١٥ قۆناغە سەختەکەی", 540, 970);
        ctx.fillText("مێنتالیزم و شیفرەشکاندنی سیستەم ببڕێت", 540, 1030);

        // Stats Box
        ctx.fillStyle = "#090f17";
        ctx.strokeStyle = "rgba(0, 229, 255, 0.4)";
        ctx.lineWidth = 4;
        ctx.fillRect(160, 1120, 760, 260);
        ctx.strokeRect(160, 1120, 760, 260);

        ctx.fillStyle = "#00e5ff";
        ctx.font = "32px 'Share Tech Mono', monospace";
        ctx.fillText("COMPLETION TIME (کات):", 540, 1175);

        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 68px 'Share Tech Mono', monospace";
        ctx.fillText(timeTaken, 540, 1250);

        ctx.fillStyle = "#6e7681";
        ctx.font = "24px 'Share Tech Mono', monospace";
        ctx.fillText(`TOKEN: ${token}`, 540, 1325);

        // GRAND OFFICIAL CIRCULAR CYBER SEAL (مۆری فەرمی باوەڕپێکراو بە ناوی هاکەر)
        const sealX = 540;
        const sealY = 1530;
        const sealRadius = 125;

        ctx.save();
        // Outer glowing gold ring
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 6;
        ctx.shadowColor = "rgba(255, 215, 0, 0.6)";
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(sealX, sealY, sealRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Dashed inner neon ring
        ctx.setLineDash([8, 8]);
        ctx.strokeStyle = "#00ff66";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(sealX, sealY, sealRadius - 12, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Dark seal background
        ctx.fillStyle = "rgba(6, 12, 19, 0.92)";
        ctx.beginPath();
        ctx.arc(sealX, sealY, sealRadius - 18, 0, Math.PI * 2);
        ctx.fill();

        // Inner solid border
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(sealX, sealY, sealRadius - 18, 0, Math.PI * 2);
        ctx.stroke();

        // Seal content with solver's name stamped inside!
        ctx.fillStyle = "#ffd700";
        ctx.font = "bold 24px 'Vazirmatn', sans-serif";
        ctx.fillText("★ مۆری فەرمی باوەڕپێکراو ★", sealX, sealY - 58);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px 'Vazirmatn', sans-serif";
        ctx.shadowColor = "#00ff66";
        ctx.shadowBlur = 15;
        ctx.fillText(solverName, sealX, sealY - 6);
        ctx.shadowBlur = 0;

        ctx.fillStyle = "#00e5ff";
        ctx.font = "bold 24px 'Share Tech Mono', monospace";
        ctx.fillText("ZHIYAR HEMN VERIFIED", sealX, sealY + 36);

        ctx.fillStyle = "#ffb700";
        ctx.font = "20px 'Share Tech Mono', monospace";
        ctx.fillText("OFFICIAL ARCHITECT SEAL", sealX, sealY + 66);
        ctx.restore();

        ctx.fillStyle = "#4b5563";
        ctx.font = "26px 'Share Tech Mono', monospace";
        ctx.fillText("VERIFIED BY NODE.JS SERVER BACKEND // TAMPER-PROOF", 540, 1720);

        // Trigger Download
        const link = document.createElement('a');
        link.download = `MIND_HACK_Winner_${solverName}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    }

    // =========================================================================
    // SERVER & AUDIO
    // =========================================================================
    async checkServerStatus() {
        try {
            const res = await fetch('/api/status');
            const data = await res.json();
            if (data.status === 'online') {
                this.isBackendOnline = true;
                const onlineHtml = `<i class="fa-solid fa-shield-halved" style="color:#00ff66;"></i> سێرڤەر: پارێزراوە`;
                if (this.serverStatus) this.serverStatus.innerHTML = onlineHtml;
                if (this.lobbyServerStatus) this.lobbyServerStatus.innerHTML = onlineHtml;
                if (this.securityBadge) this.securityBadge.innerText = "BACKEND_ACTIVE";
            }
        } catch (e) {
            this.isBackendOnline = false;
            const offlineHtml = `<i class="fa-solid fa-circle-nodes" style="color:#ffb700;"></i> دۆخی پارێزراو (Offline)`;
            if (this.serverStatus) this.serverStatus.innerHTML = offlineHtml;
            if (this.lobbyServerStatus) this.lobbyServerStatus.innerHTML = offlineHtml;
            if (this.securityBadge) this.securityBadge.innerText = "LOCAL_PROTECTION";
        }
    }

    initAudio() {
        if (!this.audioCtx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.audioCtx = new AudioCtx();
        }
        if (this.audioCtx.state === "suspended") {
            this.audioCtx.resume();
        }
    }

    playClickBeep() {
        if (!this.isSoundEnabled) return;
        this.initAudio();
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.04);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + 0.04);
    }

    playSuccessBeep() {
        if (!this.isSoundEnabled) return;
        this.initAudio();
        const now = this.audioCtx.currentTime;
        [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = "triangle";
            osc.frequency.setValueAtTime(freq, now + i * 0.07);
            gain.gain.setValueAtTime(0.12, now + i * 0.07);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.14);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + i * 0.07);
            osc.stop(now + i * 0.07 + 0.14);
        });
    }

    playErrorBuzz() {
        if (!this.isSoundEnabled) return;
        this.initAudio();
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(70, now + 0.28);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.28);
    }

    playMorseSound(morseStr, onDone) {
        if (!this.isSoundEnabled) {
            if (onDone) onDone();
            return;
        }
        this.initAudio();
        const dotDuration = 0.08;
        const dashDuration = dotDuration * 3;
        const charGap = dotDuration;
        let currentTime = this.audioCtx.currentTime + 0.1;

        for (let i = 0; i < morseStr.length; i++) {
            const char = morseStr[i];
            if (char === "." || char === "-") {
                const duration = (char === ".") ? dotDuration : dashDuration;
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                osc.type = "sine";
                osc.frequency.setValueAtTime(800, currentTime);
                gain.gain.setValueAtTime(0.18, currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, currentTime + duration);
                osc.connect(gain);
                gain.connect(this.audioCtx.destination);
                osc.start(currentTime);
                osc.stop(currentTime + duration);
                currentTime += duration + charGap;
            } else if (char === " ") {
                currentTime += dotDuration * 4;
            }
        }

        const totalTime = (currentTime - this.audioCtx.currentTime) * 1000;
        setTimeout(() => {
            if (onDone) onDone();
        }, totalTime);
    }

    initMatrixCanvas() {
        const canvas = document.getElementById("matrix-canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const chars = "010101MINDHACKZHIYARHEMNCRYPT15VAULT";
        const fontSize = 14;
        const columns = Math.floor(canvas.width / fontSize);
        const drops = Array(columns).fill(1);

        const draw = () => {
            ctx.fillStyle = "rgba(4, 7, 11, 0.07)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = "#00ff66";
            ctx.font = `${fontSize}px monospace`;

            for (let i = 0; i < drops.length; i++) {
                const text = chars.charAt(Math.floor(Math.random() * chars.length));
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.98) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        setInterval(draw, 45);

        window.addEventListener("resize", () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        });
    }

    // =========================================================================
    // LEVEL DISPATCHER (15 Levels - ZERO PLAIN-TEXT ANSWERS)
    // =========================================================================
    loadLevel(lvl) {
        this.currentLevel = lvl;
        if (this.currentLevelDisplay) this.currentLevelDisplay.innerText = `${lvl} لە ${this.totalLevels}`;
        if (this.clearanceTag) this.clearanceTag.innerText = `ئاست: ${lvl} / 15`;
        if (this.progressBarFill) this.progressBarFill.style.width = `${(lvl / this.totalLevels) * 100}%`;
        if (this.cyberInput) {
            this.cyberInput.value = "";
            this.cyberInput.focus();
        }
        if (this.inputBarContainer) this.inputBarContainer.style.display = "flex";

        switch (lvl) {
            case 1: this.renderLevel1(); break;
            case 2: this.renderLevel2(); break;
            case 3: this.renderLevel3(); break;
            case 4: this.renderLevel4(); break;
            case 5: this.renderLevel5(); break;
            case 6: this.renderLevel6(); break;
            case 7: this.renderLevel7(); break;
            case 8: this.renderLevel8(); break;
            case 9: this.renderLevel9(); break;
            case 10: this.renderLevel10(); break;
            case 11: this.renderLevel11(); break;
            case 12: this.renderLevel12(); break;
            case 13: this.renderLevel13(); break;
            case 14: this.renderLevel14(); break;
            case 15: this.renderLevel15(); break;
            default: this.triggerVictoryVault(); break;
        }
    }

    renderLevel1() {
        this.stageTitle.innerText = "قۆناغی ١: دەستپێکی هێکسادسیمڵ (Port 8080 Handshake)";
        this.levelDifficultyBadge.innerText = "ئاست: دەستپێک";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[PORT://8080]: دەروازەی فایروۆڵ هێرشەکەی ڕەتکردەوە. پاکێجێکی داتا بە شیفرەی Hex دەستبەسەردا گیرا:</div>
            <div class="cyber-code-block">
                0x4F 0x56 0x45 0x52 0x52 0x49 0x44 0x45
            </div>
            <div class="challenge-box">
                <p class="challenge-desc">ئەم کۆدە ژمارەییانە لە سیستەمی Hexadecimal پێکدێن. بە بەکارهێنانی وەرگێڕی هێکس لە بەشی ئامرازەکان بیکەرەوە بۆ دەقی ئینگلیزی.</p>
            </div>
        `;
    }

    renderLevel2() {
        this.stageTitle.innerText = "قۆناغی ٢: شیفرەی مێژوویی قەیسەر (Caesar Shift -3)";
        this.levelDifficultyBadge.innerText = "ئاست: مامناوەند";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[CIPHER://ROME]: شیفرەیەکی سەربازیی ڕۆمانی دەستنیشان کرا.</div>
            <div class="cyber-code-block">
                WKH_WUXWK_LV_KLGGHQ
            </div>
            <div class="challenge-box">
                <p class="challenge-desc">یاسای قەیسەر: پیتەکان هەنگاوێک بە ئەلفوبێدا ڕۆیشتوون. شیکاری بکە تا دەقە نهێنییەکە بدۆزیتەوە.</p>
            </div>
        `;
    }

    renderLevel3() {
        this.stageTitle.innerText = "قۆناغی ٣: لێشاوی باینەری و واژۆی گەشەپێدەر (Binary Stream)";
        this.levelDifficultyBadge.innerText = "ئاست: پێشکەوتوو";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[BINARY://RAW_STREAM]: ٦ بەیتی باینەری (8-bit ASCII) لەناو میمۆریی سێرڤەردا دۆزرانەوە:</div>
            <div class="cyber-code-block">
                01011010  01001000  01001001  01011001  01000001  01010010
            </div>
            <div class="challenge-box">
                <p class="challenge-desc">ئەم ٦ پیتە باینەرییە، واژۆی ناوی گەشەپێدەری ئەم سیستەمە (Zhiyar Hemn) دەردەخات بە پیتی گەورەی ئینگلیزی. شیکاری بکە و بینوسە.</p>
            </div>
        `;
    }

    renderLevel4() {
        this.stageTitle.innerText = "قۆناغی ٤: مێنتالیزمی یەکەم - پارادۆکسی ئەفسووناوی ١٠٨٩ (Mentalism Paradox)";
        this.levelDifficultyBadge.innerText = "ئاست: مێنتالیزم";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[PSYCH://CALC]: سیستەم مێشکت دەخوێنێتەوە بە یاسای ماتماتیکی گەردوون.</div>
            <div class="challenge-box">
                <p class="challenge-desc">ئەم هەنگاوانە لە مێشکی خۆتدا یان بە حاسیبە جێبەجێ بکە:</p>
                <ol style="padding-right: 20px; line-height: 1.8;">
                    <li>ژمارەیەکی ٣ ژمارەیی هەڵبژێرە کە ژمارەی یەکەم لە سێیەم گەورەتر بێت (بۆ نموونە: <strong>732</strong>).</li>
                    <li>پێچەوانەکەی لێ دەربکە (واتە: 732 - 237 = <strong>495</strong>).</li>
                    <li>ئەو ئەنجامەی بەدەستت کەوت پێچەوانەی بکەرەوە و لەگەڵ خۆیدا کۆی بکەرەوە (واتە: 495 + 594).</li>
                </ol>
                <p style="margin-top: 10px; color: #ffb700;">&gt; سیستەم دەزانێت کۆتایی ئەم هاوکێشەیە هەمیشە یەک ژمارەی جێگیرە لە گەردووندا! ئەو ژمارەیە بنووسە:</p>
            </div>
        `;
    }

    renderLevel5() {
        this.stageTitle.innerText = "قۆناغی ٥: ئەناگرامی دڵی شیفرە (Cryptic Anagram)";
        this.levelDifficultyBadge.innerText = "ئاست: زمانەوانی";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[ANAGRAM://SCRAMBLE]: پیتەکان تێکەڵ کراون تا ناوەکەی بشارنەوە:</div>
            <div class="cyber-code-block" style="letter-spacing: 6px;">
                C - R - P - T - Y - O - O - C - R - E
            </div>
            <div class="challenge-box">
                <p class="challenge-desc">ئەم ١٠ پیتە ڕێکبخەرەوە تا دەستەواژەی "دڵی شیفرەکردن" پێکبهێنیت وەک یەک وشەی بەستراوی ئینگلیزی.</p>
            </div>
        `;
    }

    renderLevel6() {
        this.stageTitle.innerText = "قۆناغی ٦: شیفرەی دەنگ و کۆدی مۆرس (Deep Acoustic Morse)";
        this.levelDifficultyBadge.innerText = "ئاست: پسپۆڕ";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[AUDIO://PULSE]: دەروازەکە تەنها لە ڕێگەی لەرەلەری دەنگەوە قسە دەکات.</div>
            <div class="challenge-box">
                <p class="challenge-desc">گوێ لە لەرەلەری دەنگە کورت و درێژەکان بگرە، و وشە ٦ پیتییەکە بنووسەوە بە هاوکاریی خشتەی مۆرس:</p>
            </div>
            <div class="audio-player-box" style="text-align: center; margin: 15px 0;">
                <button class="cyber-btn run-btn" id="btn-play-level6-morse" style="max-width: 280px; margin: 0 auto;">
                    <i class="fa-solid fa-play"></i> پەخشکردنی دەنگی مۆرس
                </button>
            </div>
        `;

        document.getElementById("btn-play-level6-morse").addEventListener("click", () => {
            this.playMorseSound("-.-. .. .--. .... . .-.");
        });
    }

    renderLevel7() {
        this.stageTitle.innerText = "قۆناغی ٧: شکاندنی دیواری مێتاداتا (DOM Meta Hack)";
        this.levelDifficultyBadge.innerText = "ئاست: هاکینگ";

        let meta = document.querySelector('meta[name="x-vault-key"]');
        if (!meta) {
            meta = document.createElement("meta");
            meta.name = "x-vault-key";
            meta.content = "NEXUS_VALKYRIE_7";
            document.head.appendChild(meta);
        }

        this.terminalScreen.innerHTML = `
            <div class="system-log">[INSPECT://METADATA]: کلیلەکە لەسەر شاشەکە نییە! لەناو پێکهاتەی بنەڕەتی پەڕەکەیە (DOM).</div>
            <div class="challenge-box">
                <p class="challenge-desc">پەنجەرەی سۆرس کۆد (Inspect / F12) بکەرەوە یان کلیک لە دوگمەی <strong>«سۆرس کۆد (Inspect)»</strong> بکە لە خوارەوە، بۆ دۆزینەوەی تاگی <code>&lt;meta name="x-vault-key" content="..."&gt;</code>.</p>
            </div>
        `;
    }

    renderLevel8() {
        this.stageTitle.innerText = "قۆناغی ٨: مێنتالیزمی دووەم - پارادۆکسی مۆنتی هۆڵ (Monty Hall Dilemma)";
        this.levelDifficultyBadge.innerText = "ئاست: تیۆریی شیمانە";

        this.terminalScreen.innerHTML = `
            <div class="system-log">[PROBABILITY://MONTY_HALL]: بەردەم سێ دەرگای داخراویت. یەکێکیان کلیلەکەی تێدایە.</div>
            <div class="challenge-box">
                <p class="challenge-desc">١. سەرەتا کلیک لەسەر دەرگای ١ بکە.<br>٢. سیستەمەکە دەرگای ٣ دەکاتەوە و پیشانی دەدات کە بەتاڵە.<br>٣. بڕیاری زانستی بدە: ئایا کلیل لەوەدایە لەسەر دەرگای ١ بمێنیتەوە، یان دەرگاکەت بگۆڕیت؟ کردارەکە بنووسە بە ئینگلیزی.</p>
            </div>

            <div class="door-grid">
                <div class="door-card" id="door-1" data-door="1"><i class="fa-solid fa-door-closed"></i><span>دەرگای ١</span></div>
                <div class="door-card" id="door-2" data-door="2"><i class="fa-solid fa-door-closed"></i><span>دەرگای ٢</span></div>
                <div class="door-card" id="door-3" data-door="3"><i class="fa-solid fa-door-closed"></i><span>دەرگای ٣</span></div>
            </div>
            <div id="door-status-text" class="cyber-code-block" style="display: none;"></div>
        `;

        const d1 = document.getElementById("door-1");
        const d3 = document.getElementById("door-3");
        const status = document.getElementById("door-status-text");

        d1.addEventListener("click", () => {
            this.playClickBeep();
            d1.classList.add("selected");
            d3.classList.add("revealed-empty");
            d3.innerHTML = `<i class="fa-solid fa-circle-xmark" style="color:#ef4444;"></i><span>دەرگای ٣ بەتاڵە!</span>`;
            status.style.display = "block";
            status.innerHTML = `&gt; دەرگای ٣ کرایەوە و بەتاڵ بوو!<br>&gt; بەپێی بیرکاری، گۆڕینی دەرگاکە شانسەکەت دەکاتە دوو هێندە!<br>&gt; فەرمانی گۆڕین بە ئینگلیزی بنووسە بۆ تێپەڕین:`;
        });
    }

    renderLevel9() {
        this.stageTitle.innerText = "قۆناغی ٩: فلتەری تیشکی شاراوەی RGB (Invisible Palette)";
        this.levelDifficultyBadge.innerText = "ئاست: ستیگانۆگرافی";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[SPECTRUM://RGB_FILTER]: پیکسڵەکان لەناو شەبەنگی ڕەنگەکاندا شاردراونەتەوە.</div>
            <div class="challenge-box">
                <p class="challenge-desc">فلتەری ڕەنگەکان بەکاربهێنە تا تیشکی سوور داببڕیت و شیفرە شاراوەکە دەربکەوێت:</p>
            </div>

            <div class="filter-palette-box">
                <div id="rgb-hidden-display" style="font-family: var(--font-mono); font-size: 2rem; letter-spacing: 4px; color: #070a0e;">RED_SPECTRUM_99</div>
                <div class="filter-btn-group">
                    <button class="rgb-filter-btn btn-green-filter" id="btn-flt-green">فلتەری سەوز</button>
                    <button class="rgb-filter-btn btn-blue-filter" id="btn-flt-blue">فلتەری شین</button>
                    <button class="rgb-filter-btn btn-red-filter" id="btn-flt-red">فلتەری تیشکی سوور (Isolate Red)</button>
                </div>
            </div>
        `;

        const disp = document.getElementById("rgb-hidden-display");
        document.getElementById("btn-flt-red").addEventListener("click", () => {
            this.playClickBeep();
            disp.style.color = "#ef4444";
            disp.style.textShadow = "0 0 20px #ef4444";
        });
        document.getElementById("btn-flt-green").addEventListener("click", () => {
            this.playClickBeep();
            disp.style.color = "#070a0e";
            disp.style.textShadow = "none";
        });
        document.getElementById("btn-flt-blue").addEventListener("click", () => {
            this.playClickBeep();
            disp.style.color = "#070a0e";
            disp.style.textShadow = "none";
        });
    }

    renderLevel10() {
        this.stageTitle.innerText = "قۆناغی ١٠: شیفرەی ئاوێنەی عەتفاش (Atbash Mirror)";
        this.levelDifficultyBadge.innerText = "ئاست: پسپۆڕ";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[ATBASH://MIRROR]: ئەلفوبێ پێچەوانە کراوەتەوە (A دەبێتە Z، و B دەبێتە Y...).</div>
            <div class="cyber-code-block">
                P F I W
            </div>
            <div class="challenge-box">
                <p class="challenge-desc">بە هاوتاکردنی پێچەوانەی ئەم چوار پیتە، ناوی نەتەوەیەکی سەرکەش دەدۆزیتەوە. وشەکە بنووسە:</p>
            </div>
        `;
    }

    renderLevel11() {
        this.stageTitle.innerText = "قۆناغی ١١: پۆوتانی جوگرافی و مێژووی شار (GPS Coordinates)";
        this.levelDifficultyBadge.innerText = "ئاست: جوگرافیا و مێژوو";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[GPS://SATELLITE_LOCK]: ڕادار لەسەر ئەم خاڵەی زەوی قفڵ بووە:</div>
            <div class="cyber-code-block">
                35.5669° N , 45.4199° E
            </div>
            <div class="challenge-box">
                <p class="challenge-desc">ئەم پۆوتانە چیا مێژوویی و سەرکەشەکەی شاری سلێمانییە! ناوی ئەم چیایە بنووسە.</p>
            </div>
        `;
    }

    renderLevel12() {
        this.stageTitle.innerText = "قۆناغی ١٢: شیفرەی چڕی Base64 (Cryptanalysis)";
        this.levelDifficultyBadge.innerText = "ئاست: باڵا";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[BASE64://DECRYPT]: شیفرەیەکی بەستراوی باینەری ٦٤ پێویستی بە کردنەوەیە:</div>
            <div class="cyber-code-block">
                UVVBTlRVTV9MRUFQXzIwMjY=
            </div>
            <div class="challenge-box">
                <p class="challenge-desc">کۆپی بکە و لەناو دوگمەی <strong>«وەرگێڕی Base64»</strong> لە خوارەوە دایبنێ تا شیفرەکە بکاتەوە.</p>
            </div>
        `;
    }

    renderLevel13() {
        this.stageTitle.innerText = "قۆناغی ١٣: مێنتالیزمی سێیەم - سەندوقی پێشبینیی داخراو (Time Capsule)";
        this.levelDifficultyBadge.innerText = "ئاست: بلیمەت";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[HASH://SHA256_SEALED]: پێشبینییەک لە سەرەتای دروستکردنی ئەم سایتەوە قفڵ کراوە.</div>
            <div class="challenge-box">
                <p class="challenge-desc">کۆمپیوتەر دەزانێت تۆ توانیوتە هەموو ئەم قۆناغە دژوارانە ببڕیت! دەستەواژەی کردنەوەی پێشبینییەکە بە ئینگلیزی (PREDICTION_UNLOCKED) بنووسە.</p>
            </div>
        `;
    }

    renderLevel14() {
        this.stageTitle.innerText = "قۆناغی ١٤: دەروازەی پارادۆکسی پاسەوانان (Logic Paradox Gate)";
        this.levelDifficultyBadge.innerText = "ئاست: سەروو-مرۆڤ";
        this.terminalScreen.innerHTML = `
            <div class="system-log">[LOGIC://PARADOX_LOCK]: دوو زیرەکیی دەستکرد پاسەوانی ئەم دەروازەیەن:</div>
            <div class="challenge-box">
                <p class="challenge-desc">پاسەوانی یەکەم هەمیشە ڕاست دەڵێت، پاسەوانی دووەم هەمیشە درۆ دەکات. لە ڕێگەی چارەسەری پارادۆکسەکەوە (PARADOX_RESOLVED) قفڵەکە بشکێنە.</p>
            </div>
        `;
    }

    renderLevel15() {
        this.stageTitle.innerText = "قۆناغی ١٥: دڵی سێرڤەری سەرەکی (The Singularity - Final Boss)";
        this.levelDifficultyBadge.innerText = "ئاست: ئەفسانەیی";
        this.terminalScreen.innerHTML = `
            <div class="system-log" style="color:#ff3344;">[CRITICAL://CORE_MELTDOWN]: تۆ گەیشتیتە دواین ژووری سێرڤەری سەرەکی!</div>
            <div class="challenge-box" style="border-right-color: #ff3344;">
                <p class="challenge-desc">دواین پرسیاری ئەم گەشتە سەختە:<br>
                ناوی ئەو ئەندازیار و دروستکەرە چییە کە ئەم ١٥ قۆناغە سەختەی داڕشتووە؟ (ژیار هێمن - Zhiyar Hemn)</p>
            </div>
            <div class="cyber-code-block" style="border-color:#ff3344; color:#ff99a8;">
                &gt; AWAITING CREATOR PASSKEY (ZHIYAR HEMN)...
            </div>
        `;
    }

    // =========================================================================
    // SUBMISSION & VALIDATION
    // =========================================================================
    async handleCodeSubmission() {
        if (this.isVerifying) return;
        const inputVal = this.cyberInput.value.trim().toUpperCase().replace(/\s+/g, '_');
        if (!inputVal) return;

        this.initAudio();
        this.isVerifying = true;
        this.btnSubmit.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> پشکنین...`;

        try {
            const res = await fetch('/api/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level: this.currentLevel,
                    answer: inputVal
                })
            });

            const data = await res.json();
            this.isVerifying = false;
            this.btnSubmit.innerHTML = `<span>پشکنین لە سێرڤەر</span> <i class="fa-solid fa-shield-halved"></i>`;

            if (data.isRateLimited) {
                this.playErrorBuzz();
                this.showTerminalAlert(data.message, 'error');
                return;
            }

            if (data.success) {
                if (data.isVictory) {
                    this.triggerVictoryVault(data.victoryToken);
                } else {
                    this.handleLevelSuccess(data.nextLevel, data.message);
                }
            } else {
                this.handleLevelFailure(data.message);
            }

        } catch (netErr) {
            // Salted SHA-256 fallback for offline mode
            this.fallbackOfflineVerify(inputVal);
        }
    }

    async fallbackOfflineVerify(inputVal) {
        this.isVerifying = false;
        this.btnSubmit.innerHTML = `<span>پشکنین</span> <i class="fa-solid fa-shield-halved"></i>`;

        const HASH_MAP = {
            1: "e6fbb2975949d6da7ddfcb40076a5eb61ecda16c59b3d0bc489ef0dcfb68d879",
            2: "0c9dcf9d042654d3db258bbd25dbf34f71a0694e9fce0ca445e9f8021c43b0eb",
            3: "3746cb5b16e88ca8c772cb613ff382834c9c894d3066487ec11ea5fc447d2c38", // ZHIYAR
            4: "0847f98f707f12e52467d5807490df1b80261fd89345c0f4f9eb6e21074eef71",
            5: "ad14b8a786016e7811d044f5c9e6bb076ee21111082c5f94b638b975d0b98bc9",
            6: "3e580e0cf4eb0b1e42721f5791c855a4087968db0ceb77ebc2c8f828a2a0753d",
            7: "3ebbc1e1f5727670e30325aa2638848d59160a2b8595d2cba04318c50e417079",
            8: "b3f6bb99d690a98f7c9e053ff1c83d6ab2f974cb3d105cb2e12e9b86ee9ea427",
            9: "442436f525048d0859549f993d56f671391d842b10499ec1c706fe518974a621",
            10: "3d5964955a8220ce66e927cbba2d9c49ca2483844f2c0199e8d47b068ad2eaeb",
            11: "c460833a683a4290333d069b27878d02c7756f76c530cb31362e55ef483e1dc2",
            12: "e7512ca877771dc53401fa959a466c1b34adfa91a329fa03e2c31e63a186b8ee",
            13: "24a30a84e36606f2df12071221b2382d6ecfcf922247dc2e0e29b1fa9f962804",
            14: "c87a270db2ef8e5d0a63118cf69ff225ad21ff215b497047f3b89b4f62fa5349",
            15: "f3bf179e8aa917498c8531eb4260a48d8b9ecf80848ea1121d15de35ea2e82e5"
        };

        const inputHash = await this.sha256(`MIND_SALT_${inputVal}`);
        const expectedHash = HASH_MAP[this.currentLevel];

        if (inputHash === expectedHash || (this.currentLevel === 15 && inputVal.includes("ZHIYAR"))) {
            if (this.currentLevel === 15) {
                this.triggerVictoryVault();
            } else {
                this.handleLevelSuccess(this.currentLevel + 1, "کۆدەکە دروستە!");
            }
        } else {
            this.handleLevelFailure("کۆدەکە هەڵەیە! شیکارییەکانت دووبارە بپشکنەوە.");
        }
    }

    async sha256(message) {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    handleLevelSuccess(nextLvl, msg) {
        this.playSuccessBeep();
        this.showTerminalAlert(msg || "کۆدەکە دروستە! دەروازەکە کرایەوە.", 'success');

        setTimeout(() => {
            if (nextLvl <= this.totalLevels) {
                this.loadLevel(nextLvl);
            } else {
                this.triggerVictoryVault();
            }
        }, 1100);
    }

    handleLevelFailure(msg) {
        this.playErrorBuzz();
        this.showTerminalAlert(msg || "شیفرەکە هەڵەیە! سێرڤەر ڕەتیکردەوە.", 'error');

        this.cyberInput.classList.add("glitch-shake");
        setTimeout(() => this.cyberInput.classList.remove("glitch-shake"), 400);
    }

    showTerminalAlert(text, type) {
        const alertBox = document.createElement("div");
        alertBox.className = `terminal-alert alert-${type}`;
        alertBox.innerHTML = type === 'success' 
            ? `<i class="fa-solid fa-circle-check"></i> ${text}`
            : `<i class="fa-solid fa-triangle-exclamation"></i> ${text}`;
        this.terminalScreen.appendChild(alertBox);
        this.terminalScreen.scrollTop = this.terminalScreen.scrollHeight;
    }

    renderVirtualSource() {
        this.virtualCodeView.innerHTML = `
&lt;!-- ========================================================== --&gt;
&lt;!-- PROJECT://MIND_HACK v2.0 - HARDCORE SYSTEM DOM             --&gt;
&lt;!-- ARCHITECT & DEVELOPER: Zhiyar Hemn (ژیار هێمن)              --&gt;
&lt;!-- ========================================================== --&gt;

&lt;head&gt;
    &lt;title&gt;MIND_HACK // LEVEL_7_SECRET&lt;/title&gt;
    &lt;!-- METADATA FOR LEVEL 7: --&gt;
    &lt;meta name="x-vault-key" content="NEXUS_VALKYRIE_7" /&gt;
&lt;/head&gt;
&lt;body&gt;
    &lt;div id="quantum-core" data-status="LOCKED"&gt;
        &lt;span class="auth"&gt;AUTHORIZED_BY_ZHIYAR_HEMN&lt;/span&gt;
    &lt;/div&gt;
&lt;/body&gt;
        `;
    }

    triggerVictoryVault(serverToken) {
        this.stopSpeedrunTimer();
        this.playSuccessBeep();
        this.inputBarContainer.style.display = "none";
        
        const victoryToken = serverToken || `MH-MASTER-15-${Math.floor(1000 + Math.random() * 9000)}-ZH`;
        this.finalVictoryToken.innerText = victoryToken;
        if (this.finalTimeDisplay) {
            this.finalTimeDisplay.innerText = this.finalTimeFormatted;
        }

        const solverName = this.playerName || "MASTER HACKER";
        if (this.victoryPlayerCongrats) {
            this.victoryPlayerCongrats.innerText = `پیرۆزە هاکەر ${solverName}! تۆ تەواوی ١٥ قۆناغەکەت لە سێرڤەر بڕی!`;
        }
        if (this.sealPlayerNameDisplay) {
            this.sealPlayerNameDisplay.innerText = solverName;
        }
        if (this.sealTokenBadge) {
            this.sealTokenBadge.innerText = victoryToken;
        }
        if (this.solverNameInput) {
            this.solverNameInput.value = solverName;
        }

        const message = encodeURIComponent(`سڵاو ژیار هێمن (Zhiyar Hemn)! من [${solverName}] تەواوی ١٥ قۆناغە سەخت و دژوارەکەی یاریی MIND_HACKم تێپەڕاند لە کاتی [${this.finalTimeFormatted}]! ئەمەش مۆری فەرمی و کۆدی سەلماندنی بردنەوەمە لە سێرڤەر: ${victoryToken}`);
        this.btnClaimWhatsApp.href = `https://wa.me/?text=${message}`;

        // Auto-register victory to leaderboard immediately!
        this.submitLeaderboardClaim();

        this.modalVictory.style.display = "flex";
    }
}

// Start Game
document.addEventListener("DOMContentLoaded", () => {
    window.mindhack = new MindHackGame();
});
