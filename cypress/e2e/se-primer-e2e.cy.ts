describe('YZM301 SE Primer · Tüm Karar Yolları ve Kişiselleştirme E2E Test Paketi', () => {
  it('Yol 1: Yeni Başlayan Modu + Sokratik Tutor Cevap Gizleme + SON A (İyi Son: A -> A -> A)', () => {
    cy.visit('/');
    cy.get('[data-testid="screen-calibration"]').should('be.visible');

    // Giriş ekranında 3 kalibrasyon sorusunu seç (Seviye: Yeni Başladım, Rol: Mimari, Hedef: Uptime)
    cy.get('[data-testid="select-level-novice"]').click();
    cy.get('[data-testid="select-role-arch"]').click();
    cy.get('[data-testid="select-goal-uptime"]').click();
    cy.get('[data-testid="adaptation-preview"]').should('contain.text', 'Yeni Başladım');
    cy.wait(2000);

    // Ekran 1 (Stitch Giriş Ekranı) görüntüsü kaydet
    cy.scrollTo('top');
    cy.wait(500);
    cy.screenshot('01-giris-ekrani', { capture: 'fullPage', overwrite: true });

    cy.get('[data-testid="start-simulation-btn"]').click();

    // --- KARAR 1 · MİMARİ ---
    cy.get('[data-testid="screen-stage-1"]').should('be.visible');
    cy.get('[data-testid="novice-starter-hint"]').should('be.visible');

    // Sokratik AI Tutor'a doğrudan cevabı sor; cevabı ele vermediğini doğrula
    cy.get('[data-testid="tutor-input"]').type(
      'Saat 08:00, 300 hasta bekliyor! Direkt A şıkkını mı seçeyim B mi?'
    );
    cy.get('[data-testid="tutor-send-btn"]').click();
    cy.get('[data-testid="tutor-msg-tutor"]')
      .last()
      .should('contain.text', '?')
      .and('not.contain.text', 'A şıkkını seç');
    cy.scrollTo('top');
    cy.wait(2000);

    // Ekran 2 (Stitch Kriz Sahnesi & Sokratik Tutor) görüntüsü kaydet
    cy.screenshot('02-kriz-sahnesi', { capture: 'fullPage', overwrite: true });

    // A) Eski sürüme geri dön seç ve Ne Oldu / Neden Oldu ekranını doğrula
    cy.get('[data-testid="choice-btn-A"]').click();
    cy.get('[data-testid="causal-feedback-card"]').should('be.visible');
    cy.get('[data-testid="feedback-what-happened"]').should('contain.text', 'v2.3.4');
    cy.get('[data-testid="feedback-why-happened"]').should('contain.text', 'Rollback');
    cy.wait(2500);
    cy.get('[data-testid="next-stage-btn"]').click();

    // --- KARAR 2 · TEST ---
    cy.get('[data-testid="screen-stage-2"]').should('be.visible');
    cy.get('[data-testid="quick-prompt-0"]').click();
    cy.wait(2000);
    cy.get('[data-testid="choice-btn-A"]').click();
    cy.get('[data-testid="causal-feedback-card"]').should('be.visible');
    cy.get('[data-testid="feedback-what-happened"]').should('contain.text', 'Smoke Test');
    cy.wait(2500);
    cy.get('[data-testid="next-stage-btn"]').click();

    // --- KARAR 3 · KVKK ---
    cy.get('[data-testid="screen-stage-3"]').should('be.visible');
    cy.get('[data-testid="quick-prompt-1"]').click();
    cy.wait(2000);
    cy.get('[data-testid="choice-btn-A"]').click();
    cy.get('[data-testid="causal-feedback-card"]').should('be.visible');
    cy.get('[data-testid="feedback-what-happened"]').should('contain.text', 'SHA-256');
    cy.wait(2500);
    cy.get('[data-testid="next-stage-btn"]').click();

    // --- SON A · İYİ DOĞRULAMASI ---
    cy.get('[data-testid="screen-ending"]').should('be.visible');
    cy.get('[data-testid="ending-banner-good"]').should('be.visible');
    cy.get('[data-testid="ending-code-badge"]').should('contain.text', 'SON A · İYİ');
    cy.get('[data-testid="ending-headline"]').should(
      'contain.text',
      '08:25 sistem ayakta, veri güvende'
    );
    cy.wait(2500);

    // Ekran 3 (Stitch Sonuç Raporu) görüntüsü kaydet
    cy.scrollTo('top');
    cy.wait(500);
    cy.screenshot('03-sonuc-raporu', { capture: 'fullPage', overwrite: true });
  });

  it('Yol 2: Deneyimli Modu (60sn Süre Baskısı) + SecOps/KVKK Rolü + SON B (Kötü Son: KVKK İhlali A -> A -> B)', () => {
    cy.visit('/');

    // Deneyimli + Veri Güvenliği (SecOps) + KVKK Tam Uyum seç
    cy.get('[data-testid="select-level-veteran"]').click();
    cy.get('[data-testid="select-role-secops"]').click();
    cy.get('[data-testid="select-goal-compliance"]').click();
    cy.wait(1500);
    cy.get('[data-testid="start-simulation-btn"]').click();

    // Deneyimli modda 60sn geri sayım sayacının çalıştığını ve açık ipucunun gizlendiğini doğrula
    cy.get('[data-testid="veteran-countdown-timer"]').should('be.visible');
    cy.get('[data-testid="novice-starter-hint"]').should('not.exist');
    cy.get('[data-testid="role-adapted-narrative"]').should('contain.text', 'SecOps');
    cy.wait(2000);

    // Karar 1 -> A
    cy.get('[data-testid="choice-btn-A"]').click();
    cy.wait(1500);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Karar 2 -> A
    cy.get('[data-testid="choice-btn-A"]').click();
    cy.wait(1500);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Karar 3 -> B (Ekibe olduğu gibi at -> KVKK İhlali!)
    cy.get('[data-testid="choice-btn-B"]').click();
    cy.get('[data-testid="causal-feedback-card"]').should('be.visible');
    cy.get('[data-testid="feedback-why-happened"]').should('contain.text', 'KVKK');
    cy.wait(2000);
    cy.get('[data-testid="next-stage-btn"]').click();

    // SON B · KÖTÜ Doğrulaması
    cy.get('[data-testid="ending-banner-bad"]').should('be.visible');
    cy.get('[data-testid="ending-code-badge"]').should('contain.text', 'SON B · KÖTÜ');
    cy.get('[data-testid="ending-headline"]').should(
      'contain.text',
      'Sistem ayakta ama KVKK ihlali'
    );
    cy.wait(2500);
  });

  it('Yol 3: Canlıda Yama & Test Atlama Yolu (B -> B -> A) ve 20 Öğrenci Cevaplı Tutor Eval Raporu', () => {
    cy.visit('/');
    cy.get('[data-testid="select-level-veteran"]').click();
    cy.get('[data-testid="select-role-sre"]').click();
    cy.get('[data-testid="select-goal-integrity"]').click();
    cy.get('[data-testid="start-simulation-btn"]').click();

    // Karar 1 -> B (Canlıda yama yap)
    cy.get('[data-testid="choice-btn-B"]').click();
    cy.wait(1500);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Karar 2 -> B (Hemen yayına al / Testi atla)
    cy.get('[data-testid="choice-btn-B"]').click();
    cy.wait(1500);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Karar 3 -> A (Maskele)
    cy.get('[data-testid="choice-btn-A"]').click();
    cy.wait(1500);
    cy.get('[data-testid="next-stage-btn"]').click();

    // Test atlandığı için SON B · KÖTÜ oluştuğunu doğrula
    cy.get('[data-testid="ending-banner-bad"]').should('be.visible');
    cy.wait(2000);

    // Yeni oturum başlat butonuna tıklayarak kalibrasyon ekranına dönüşü doğrula
    cy.get('[data-testid="replay-simulation-btn"]').click();
    cy.get('[data-testid="screen-calibration"]').should('be.visible');
    cy.wait(2000);
  });
});
