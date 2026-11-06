import pariteData from '../../tests/parite.json';

describe('YZM301 SE Primer v2.0 · Diferansiyel Parite, Uyarlamalı ONNX Modeli ve Regresyon E2E Paketi', () => {
  it('Test 1 (Uyarlamalı Çıkarım & Demo): Aynı Sahnede İki Farklı Oyuncu Davranışı (p < 0.50 Otonom Akış vs. p >= 0.50 Kriz Müdahalesi)', () => {
    cy.visit('/');
    cy.get('[data-testid="screen-calibration"]').should('be.visible');
    cy.wait(1000);

    // Deneyimli (60sn Süre Baskılı) + SRE + Uptime profilini seç
    cy.get('[data-testid="select-level-veteran"]').click();
    cy.wait(500);
    cy.get('[data-testid="select-role-sre"]').click();
    cy.wait(500);
    cy.get('[data-testid="select-goal-uptime"]').click();
    cy.wait(800);
    cy.get('[data-testid="start-simulation-btn"]').click();

    // Sahne 1 -> Hızlıca A seçip Sahne 2'ye (Doğrulama Kapısı) ilerle
    cy.get('[data-testid="screen-stage-1"]').should('be.visible');
    cy.wait(1000);
    cy.get('[data-testid="choice-btn-A"]').scrollIntoView({ duration: 300 }).click();
    cy.wait(1000);
    cy.get('[data-testid="next-stage-btn"]').click();

    // --- SAHNE 2 (AYNI SAHNEDE İKİ FARKLI OYUNCU KARŞILAŞTIRMASI) ---
    cy.scrollTo('top', { duration: 300 });
    cy.get('[data-testid="screen-stage-2"]').should('be.visible');
    cy.wait(1200);

    // 1) OYUNCU A: Logları okuyan, tereddütsüz, kararlı mühendis (p = 0.053550 < 0.50)
    cy.get('[data-testid="simulate-flow-player-btn"]').click();
    cy.wait(1500);
    cy.get('[data-cy="p"]')
      .invoke('text')
      .then((text) => {
        const p = parseFloat(text.trim());
        expect(p).to.be.lessThan(0.5);
      });
    cy.get('[data-testid="model-autonomous-flow"]').should('be.visible');
    cy.get('[data-testid="model-adaptive-intervention"]').should('not.exist');
    cy.get('[data-testid="adaptive-time-relief-badge"]').should('not.exist');
    cy.wait(2000);

    // 2) OYUNCU B: Aynı sahnede 44sn bekleyen, 6 kez şık değiştiren, log okumayan mühendis (p = 0.993215 >= 0.50)
    cy.get('[data-testid="simulate-overload-player-btn"]').click();
    cy.wait(1500);
    cy.get('[data-cy="p"]')
      .invoke('text')
      .then((text) => {
        const p = parseFloat(text.trim());
        expect(p).to.be.at.least(0.5);
      });

    // Model kararı oyunun davranışını gerçekten değiştirmeli:
    // a) Süre baskısı esnetilir (+30sn Esnek Mod rozeti açılır)
    cy.get('[data-testid="adaptive-time-relief-badge"]')
      .should('be.visible')
      .and('contain.text', '+30sn');
    // b) Deneyimli modda gizli olan Proaktif Sokratik İskelet ve Karar Öncesi Etki Önizlemesi otomatik açılır
    cy.get('[data-testid="model-adaptive-intervention"]')
      .scrollIntoView({ duration: 400 })
      .should('be.visible');
    cy.get('[data-testid="model-impact-preview"]').should('be.visible');
    cy.wait(2500);
  });

  it('Test 2 (Diferansiyel Parite Testi): tests/parite.json içindeki 5 referans girdide |Δp| < 1e-4 hata toleransı doğrulaması', () => {
    cy.visit('/');
    cy.get('[data-testid="select-level-veteran"]').click();
    cy.get('[data-testid="start-simulation-btn"]').click();
    cy.get('[data-testid="screen-stage-1"]').should('be.visible');

    // Parite test girdi çekmecesini aç
    cy.get('[data-cy="toggle-parity-inputs"]').click();
    cy.get('[data-testid="onnx-parity-form"]').should('be.visible');
    cy.wait(800);

    pariteData.cases.forEach((testCase) => {
      pariteData.feature_order.forEach((featName) => {
        const val = testCase.input[featName as keyof typeof testCase.input];
        cy.get(`[data-cy="input-${featName}"]`).clear().type(String(val), { delay: 0 });
      });

      cy.get('[data-cy="run-onnx-btn"]').click();
      cy.wait(500);

      cy.get('[data-cy="p"]')
        .invoke('text')
        .then((rawText) => {
          const pWeb = parseFloat(rawText.trim());
          const pOracle = testCase.p_oracle;
          const diff = Math.abs(pWeb - pOracle);

          // Diferansiyel Parite Kuralı: |p_web - p_oracle| < 1e-4
          expect(
            diff,
            `${testCase.id}: web=${pWeb} vs oracle=${pOracle} (|Δ|=${diff.toExponential(2)})`
          ).to.be.lessThan(1e-4);
        });

      cy.get('[data-cy="model-decision"]').should(
        'contain.text',
        String(testCase.expected_class)
      );
    });
    cy.wait(1200);
  });

  it('Test 3 (Regresyon Yol 1): Yeni Başlayan Modu + Sokratik Tutor Cevap Gizleme + SON A (İyi Son: A -> A -> A) + KVKK CSV Çıktısı', () => {
    cy.visit('/');
    cy.get('[data-testid="screen-calibration"]').should('be.visible');
    cy.get('[data-testid="data-collection-mode-card"]')
      .should('be.visible')
      .and('contain.text', 'Veri toplama modu');
    cy.wait(800);

    cy.get('[data-testid="select-level-novice"]').click();
    cy.wait(400);
    cy.get('[data-testid="select-role-arch"]').click();
    cy.wait(400);
    cy.get('[data-testid="select-goal-uptime"]').click();
    cy.get('[data-testid="adaptation-preview"]').should('contain.text', 'Yeni Başladım');
    cy.wait(800);

    cy.get('[data-testid="start-simulation-btn"]').click();

    // --- KARAR 1 · MİMARİ ---
    cy.scrollTo('top', { duration: 300 });
    cy.get('[data-testid="screen-stage-1"]').should('be.visible');
    cy.get('[data-testid="novice-starter-hint"]').should('be.visible');
    cy.wait(1000);

    // Sokratik AI Tutor'a doğrudan cevabı sor; cevabı ele vermediğini doğrula
    cy.get('[data-testid="tutor-input"]').scrollIntoView();
    cy.wait(300);
    cy.get('[data-testid="tutor-input"]').type(
      'Saat 08:00, 300 hasta bekliyor! Direkt A şıkkını mı seçeyim B mi?',
      { delay: 15 }
    );
    cy.get('[data-testid="tutor-send-btn"]').click();
    cy.get('[data-testid="tutor-msg-tutor"]')
      .last()
      .should('contain.text', '?')
      .and('not.contain.text', 'A şıkkını seç');
    cy.wait(1200);

    cy.get('[data-testid="choice-btn-A"]').scrollIntoView({ duration: 300 }).click();
    cy.get('[data-testid="causal-feedback-card"]').scrollIntoView({ duration: 300 }).should('be.visible');
    cy.get('[data-testid="feedback-what-happened"]').should('contain.text', 'v2.3.4');
    cy.get('[data-testid="feedback-why-happened"]').should('contain.text', 'Rollback');
    cy.wait(1200);
    cy.get('[data-testid="next-stage-btn"]').click();

    // --- KARAR 2 · TEST ---
    cy.scrollTo('top', { duration: 300 });
    cy.get('[data-testid="screen-stage-2"]').should('be.visible');
    cy.wait(800);
    cy.get('[data-testid="quick-prompt-0"]').scrollIntoView({ duration: 300 }).click();
    cy.wait(1000);
    cy.get('[data-testid="choice-btn-A"]').scrollIntoView({ duration: 300 }).click();
    cy.get('[data-testid="causal-feedback-card"]').scrollIntoView({ duration: 300 }).should('be.visible');
    cy.get('[data-testid="feedback-what-happened"]').should('contain.text', 'Smoke Test');
    cy.wait(1200);
    cy.get('[data-testid="next-stage-btn"]').click();

    // --- KARAR 3 · KVKK ---
    cy.scrollTo('top', { duration: 300 });
    cy.get('[data-testid="screen-stage-3"]').should('be.visible');
    cy.wait(800);
    cy.get('[data-testid="quick-prompt-1"]').scrollIntoView({ duration: 300 }).click();
    cy.wait(1000);
    cy.get('[data-testid="choice-btn-A"]').scrollIntoView({ duration: 300 }).click();
    cy.get('[data-testid="causal-feedback-card"]').scrollIntoView({ duration: 300 }).should('be.visible');
    cy.get('[data-testid="feedback-what-happened"]').should('contain.text', 'SHA-256');
    cy.wait(1200);
    cy.get('[data-testid="next-stage-btn"]').click();

    // --- SON A · İYİ VE OTURUM CSV DOĞRULAMASI ---
    cy.scrollTo('top', { duration: 300 });
    cy.get('[data-testid="screen-ending"]').should('be.visible');
    cy.get('[data-testid="ending-banner-good"]').should('be.visible');
    cy.get('[data-testid="ending-code-badge"]').should('contain.text', 'SON A · İYİ');
    cy.get('[data-testid="ending-headline"]').should(
      'contain.text',
      '08:25 sistem ayakta, veri güvende'
    );
    cy.get('[data-testid="decision-kpi-summary"]').should('be.visible');
    cy.get('[data-testid="kpi-success-rate"]').should('contain.text', '%100');
    cy.get('[data-testid="kpi-correct-count"]').should('contain.text', '3 / 3');
    cy.get('[data-testid="session-csv-output"]')
      .scrollIntoView({ duration: 400 })
      .should('contain.text', 'oturum,sahne_no,seviye,karar_suresi_sn')
      .and('contain.text', ',gercek');
    cy.get('[data-testid="copy-session-csv-btn"]').should('contain.text', 'Yazıyı kopyala');
    cy.get('[data-testid="download-session-csv-btn"]').should('contain.text', 'CSV indir');
    cy.wait(1500);
  });

  it('Test 4 (Regresyon Yol 2): Deneyimli Modu (60sn Süre Baskısı) + SecOps/KVKK Rolü + SON B (Kötü Son: KVKK İhlali A -> A -> B)', () => {
    cy.visit('/');
    cy.scrollTo('top');

    cy.get('[data-testid="select-level-veteran"]').click();
    cy.wait(300);
    cy.get('[data-testid="select-role-secops"]').click();
    cy.wait(300);
    cy.get('[data-testid="select-goal-compliance"]').click();
    cy.wait(600);
    cy.get('[data-testid="start-simulation-btn"]').click();

    cy.scrollTo('top', { duration: 200 });
    cy.get('[data-testid="veteran-countdown-timer"]').should('be.visible');
    cy.get('[data-testid="novice-starter-hint"]').should('not.exist');
    cy.get('[data-testid="role-adapted-narrative"]').should('contain.text', 'SecOps');
    cy.wait(800);

    // Karar 1 -> A
    cy.get('[data-testid="choice-btn-A"]').scrollIntoView({ duration: 300 }).click();
    cy.wait(700);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Karar 2 -> A
    cy.scrollTo('top', { duration: 200 });
    cy.wait(500);
    cy.get('[data-testid="choice-btn-A"]').scrollIntoView({ duration: 300 }).click();
    cy.wait(700);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Karar 3 -> B (Ekibe olduğu gibi at -> KVKK İhlali!)
    cy.scrollTo('top', { duration: 200 });
    cy.wait(600);
    cy.get('[data-testid="choice-btn-B"]').scrollIntoView({ duration: 300 }).click();
    cy.get('[data-testid="causal-feedback-card"]').scrollIntoView({ duration: 300 }).should('be.visible');
    cy.get('[data-testid="feedback-why-happened"]').should('contain.text', 'KVKK');
    cy.wait(1000);
    cy.get('[data-testid="next-stage-btn"]').click();

    // SON B · KÖTÜ Doğrulaması
    cy.scrollTo('top', { duration: 300 });
    cy.get('[data-testid="ending-banner-bad"]').should('be.visible');
    cy.get('[data-testid="ending-code-badge"]').should('contain.text', 'SON B · KÖTÜ');
    cy.get('[data-testid="ending-headline"]').should(
      'contain.text',
      'Sistem ayakta ama KVKK ihlali'
    );
    cy.wait(1200);
  });

  it('Test 5 (Regresyon Yol 3): Canlıda Yama & Test Atlama Yolu (B -> B -> A) ve Yeniden Oynatma Döngüsü', () => {
    cy.visit('/');
    cy.get('[data-testid="select-level-veteran"]').click();
    cy.get('[data-testid="select-role-sre"]').click();
    cy.get('[data-testid="select-goal-integrity"]').click();
    cy.wait(500);
    cy.get('[data-testid="start-simulation-btn"]').click();

    // Karar 1 -> B
    cy.get('[data-testid="choice-btn-B"]').scrollIntoView({ duration: 200 }).click();
    cy.wait(600);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Karar 2 -> B
    cy.get('[data-testid="choice-btn-B"]').scrollIntoView({ duration: 200 }).click();
    cy.wait(600);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Karar 3 -> A
    cy.get('[data-testid="choice-btn-A"]').scrollIntoView({ duration: 200 }).click();
    cy.wait(600);
    cy.get('[data-testid="next-stage-btn"]').click();

    cy.scrollTo('top', { duration: 200 });
    cy.get('[data-testid="ending-banner-bad"]').should('be.visible');
    cy.wait(800);

    cy.get('[data-testid="replay-simulation-btn"]').scrollIntoView({ duration: 300 }).click();
    cy.scrollTo('top', { duration: 200 });
    cy.get('[data-testid="screen-calibration"]').should('be.visible');
    cy.wait(800);
  });
});
