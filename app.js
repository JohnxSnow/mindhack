/**
 * دۆسیە تاریکەکان - Client Engine
 * Developer: Zhiyar Hemn (ژیار هێمن)
 */

class DarkFilesGame {
    constructor() {
        this.currentCaseIndex = 0;
        this.activeCase = GAME_CASES[0];
        this.stressLevel = 15;
        this.remainingTurns = 10;
        this.confrontedEvidenceIds = new Set();
        this.isVoiceEnabled = true;
        this.isSoundMuted = false;
        this.isTyping = false;

        this.initDOMElements();
        this.initEventListeners();
        this.loadCase(0);
    }

    initDOMElements() {
        this.activeCaseNameEl = document.getElementById("active-case-name");
        this.suspectNameEl = document.getElementById("suspect-name");
        this.stressBarEl = document.getElementById("stress-bar");
        this.stressPercentageEl = document.getElementById("stress-percentage");
        this.turnsLeftEl = document.getElementById("turns-left");
        this.soundIconEl = document.getElementById("sound-icon");
        this.btnToggleSound = document.getElementById("btn-toggle-sound");

        this.suspectAvatarImg = document.getElementById("suspect-avatar-img");
        this.suspectMoodBadge = document.getElementById("suspect-mood-badge");
        this.suspectMoodText = document.getElementById("suspect-mood-text");
        this.voiceWaveEl = document.getElementById("voice-wave");
        this.dialogueFeed = document.getElementById("dialogue-feed");

        this.evidenceContainer = document.getElementById("evidence-container");
        this.evidenceCountBadge = document.getElementById("evidence-count");
        this.caseDescriptionEl = document.getElementById("case-description");
        this.detectiveNotesEl = document.getElementById("detective-notes");
        this.suggestedChipsContainer = document.getElementById("suggested-chips");

        this.questionInput = document.getElementById("player-question-input");
        this.btnSendQuestion = document.getElementById("btn-send-question");
        this.btnQuickVoice = document.getElementById("btn-quick-voice");
        this.voiceToggleLabel = document.getElementById("voice-toggle-label");
        this.btnAccuse = document.getElementById("btn-accuse");

        this.casesModal = document.getElementById("cases-modal");
        this.btnCases = document.getElementById("btn-cases");
        this.btnCloseCases = document.getElementById("btn-close-cases");
        this.casesGrid = document.getElementById("cases-grid");

        this.accusalModal = document.getElementById("accusal-modal");
        this.btnCloseAccusal = document.getElementById("btn-close-accusal");
        this.accuseSuspectNameEl = document.getElementById("accuse-suspect-name");
        this.btnConfirmVerdict = document.getElementById("btn-confirm-verdict");

        this.endingModal = document.getElementById("ending-modal");
        this.endingStampEl = document.getElementById("ending-stamp");
        this.endingTitleEl = document.getElementById("ending-title");
        this.endingBodyEl = document.getElementById("ending-body");
        this.endingStatsEl = document.getElementById("ending-stats");
        this.btnRestartCase = document.getElementById("btn-restart-case");

        this.developerModal = document.getElementById("developer-modal");
        this.btnDeveloper = document.getElementById("btn-developer");
        this.btnCloseDev = document.getElementById("btn-close-dev");
    }

    initEventListeners() {
        this.btnSendQuestion.addEventListener("click", () => this.handlePlayerQuestion());
        this.questionInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                this.handlePlayerQuestion();
            }
        });

        this.btnQuickVoice.addEventListener("click", () => {
            this.isVoiceEnabled = !this.isVoiceEnabled;
            this.voiceToggleLabel.innerText = this.isVoiceEnabled ? "دەنگ: چالاکە" : "دەنگ: کوژاوەتەوە";
        });

        this.btnToggleSound.addEventListener("click", () => {
            this.isSoundMuted = !this.isSoundMuted;
            this.soundIconEl.className = this.isSoundMuted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
        });

        this.btnCases.addEventListener("click", () => {
            this.renderCasesGrid();
            this.casesModal.style.display = "flex";
        });
        this.btnCloseCases.addEventListener("click", () => this.casesModal.style.display = "none");

        this.btnAccuse.addEventListener("click", () => {
            this.accuseSuspectNameEl.innerText = this.activeCase.suspect.name;
            this.accusalModal.style.display = "flex";
        });
        this.btnCloseAccusal.addEventListener("click", () => this.accusalModal.style.display = "none");
        this.btnConfirmVerdict.addEventListener("click", () => this.handleVerdictConfirm());

        this.btnRestartCase.addEventListener("click", () => {
            this.endingModal.style.display = "none";
            this.loadCase(this.currentCaseIndex);
        });

        this.btnDeveloper.addEventListener("click", () => this.developerModal.style.display = "flex");
        this.btnCloseDev.addEventListener("click", () => this.developerModal.style.display = "none");

        window.addEventListener("click", (e) => {
            if (e.target === this.casesModal) this.casesModal.style.display = "none";
            if (e.target === this.accusalModal) this.accusalModal.style.display = "none";
            if (e.target === this.developerModal) this.developerModal.style.display = "none";
        });
    }

    speakKurdish(text) {
        if (!this.isVoiceEnabled || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const clean = text.replace(/\(.*?\)/g, "").trim();
        if (!clean) return;

        const u = new SpeechSynthesisUtterance(clean);
        u.rate = 0.95;
        this.voiceWaveEl.style.display = "flex";
        u.onend = () => this.voiceWaveEl.style.display = "none";
        u.onerror = () => this.voiceWaveEl.style.display = "none";
        window.speechSynthesis.speak(u);
    }

    loadCase(idx) {
        this.currentCaseIndex = idx;
        this.activeCase = GAME_CASES[idx];
        this.stressLevel = this.activeCase.suspect.initialStress;
        this.remainingTurns = 10;
        this.confrontedEvidenceIds.clear();

        this.activeCaseNameEl.innerText = this.activeCase.title.split(":")[0];
        this.suspectNameEl.innerText = `${this.activeCase.suspect.name} (${this.activeCase.suspect.role})`;
        this.suspectAvatarImg.src = this.activeCase.suspect.avatar;
        this.caseDescriptionEl.innerText = this.activeCase.description;

        this.updateStressHUD();
        this.updateTurnsHUD();
        this.renderEvidenceList();
        this.renderSuggestedChips();

        this.dialogueFeed.innerHTML = "";
        this.detectiveNotesEl.innerHTML = "";
        this.addDetectiveNote("سەرەتای لێکۆڵینەوە", `دۆسیەی «${this.activeCase.title}» کرایەوە.`);

        setTimeout(() => {
            this.appendSuspectBubble(this.activeCase.suspect.introGreeting, this.activeCase.suspect.initialMood);
        }, 300);
    }

    renderEvidenceList() {
        this.evidenceContainer.innerHTML = "";
        this.evidenceCountBadge.innerText = `${this.activeCase.evidence.length} بەڵگە`;

        this.activeCase.evidence.forEach(ev => {
            const card = document.createElement("div");
            card.className = "evidence-card";
            card.id = `card-${ev.id}`;
            card.innerHTML = `
                <div class="evidence-card-header">
                    <span class="evidence-name">${ev.name}</span>
                    <span class="evidence-tag">${ev.tag}</span>
                </div>
                <p class="evidence-desc">${ev.desc}</p>
                <button class="btn-confront">ڕووبەڕووی بکەرەوە</button>
            `;
            card.querySelector(".btn-confront").addEventListener("click", () => this.confrontWithEvidence(ev));
            this.evidenceContainer.appendChild(card);
        });
    }

    renderSuggestedChips() {
        this.suggestedChipsContainer.innerHTML = "";
        this.activeCase.suggestedQuestions.forEach(q => {
            const chip = document.createElement("button");
            chip.className = "inquiry-chip";
            chip.innerText = q;
            chip.addEventListener("click", () => {
                this.questionInput.value = q;
                this.handlePlayerQuestion();
            });
            this.suggestedChipsContainer.appendChild(chip);
        });
    }

    renderCasesGrid() {
        this.casesGrid.innerHTML = "";
        GAME_CASES.forEach((c, idx) => {
            const card = document.createElement("div");
            card.className = "case-card";
            card.innerHTML = `<h4>${c.title}</h4><p>${c.description}</p>`;
            card.addEventListener("click", () => {
                this.casesModal.style.display = "none";
                this.loadCase(idx);
            });
            this.casesGrid.appendChild(card);
        });
    }

    updateStressHUD() {
        this.stressLevel = Math.min(100, Math.max(0, this.stressLevel));
        this.stressBarEl.style.width = `${this.stressLevel}%`;
        this.stressPercentageEl.innerText = `${this.stressLevel}٪`;
    }

    updateTurnsHUD() {
        this.turnsLeftEl.innerText = `${this.remainingTurns} / ١٠`;
    }

    addDetectiveNote(t, desc) {
        const n = document.createElement("div");
        n.className = "note-card";
        n.innerHTML = `<span class="note-time">${t}</span><p>${desc}</p>`;
        this.detectiveNotesEl.prepend(n);
    }

    handlePlayerQuestion() {
        if (this.isTyping) return;
        const q = this.questionInput.value.trim();
        if (!q) return;

        this.appendPlayerBubble(q);
        this.questionInput.value = "";
        this.remainingTurns--;
        this.updateTurnsHUD();

        this.isTyping = true;
        setTimeout(() => {
            const res = this.evaluateResponse(q);
            this.stressLevel += res.stressDelta;
            this.updateStressHUD();
            this.appendSuspectBubble(res.text, res.mood, () => {
                this.isTyping = false;
            });
        }, 500);
    }

    evaluateResponse(txt) {
        const norm = txt.toLowerCase();
        const smart = this.activeCase.smartResponses;
        for (const k in smart) {
            if (k === 'default') continue;
            if (smart[k].keywords.some(kw => norm.includes(kw))) {
                return smart[k];
            }
        }
        return smart.default;
    }

    confrontWithEvidence(ev) {
        if (this.confrontedEvidenceIds.has(ev.id)) return;
        this.confrontedEvidenceIds.add(ev.id);

        const card = document.getElementById(`card-${ev.id}`);
        if (card) card.classList.add("confronted");

        const bubble = document.createElement("div");
        bubble.className = "dialogue-bubble bubble-confront";
        bubble.innerText = `لێکۆڵەر بەڵگەی «${ev.name}»ی پیشانی تۆمەتبار دا!`;
        this.dialogueFeed.appendChild(bubble);

        this.stressLevel += ev.stressImpact;
        this.updateStressHUD();
        this.addDetectiveNote("بەڵگە", ev.dialogueConfront.note);

        setTimeout(() => {
            this.appendSuspectBubble(ev.dialogueConfront.text, ev.dialogueConfront.mood);
        }, 600);
    }

    appendPlayerBubble(text) {
        const b = document.createElement("div");
        b.className = "dialogue-bubble bubble-player";
        b.innerHTML = `<div class="bubble-speaker">لێکۆڵەر (تۆ)</div><div class="bubble-text">${text}</div>`;
        this.dialogueFeed.appendChild(b);
        this.dialogueFeed.scrollTop = this.dialogueFeed.scrollHeight;
    }

    appendSuspectBubble(text, mood, cb) {
        const b = document.createElement("div");
        b.className = "dialogue-bubble bubble-suspect";
        b.innerHTML = `
            <div class="bubble-speaker">${this.activeCase.suspect.name}</div>
            <div class="bubble-text">${text}</div>
        `;
        this.dialogueFeed.appendChild(b);
        this.dialogueFeed.scrollTop = this.dialogueFeed.scrollHeight;
        this.speakKurdish(text);
        if (cb) cb();
    }

    handleVerdictConfirm() {
        this.accusalModal.style.display = "none";
        const val = document.querySelector('input[name="verdict_choice"]:checked').value;
        const e = this.activeCase.endings;
        let chosen = e.coldCase;
        if (val === 'guilty') {
            chosen = (this.stressLevel >= 60 && this.confrontedEvidenceIds.size >= 2) ? e.master : e.closeCall;
        }

        this.endingStampEl.innerText = chosen.stamp;
        this.endingTitleEl.innerText = chosen.title;
        this.endingBodyEl.innerText = chosen.desc;
        this.endingStatsEl.innerText = `ئاستی لێکۆڵینەوە: ${chosen.accuracy}`;
        this.endingModal.style.display = "flex";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    window.game = new DarkFilesGame();
});

