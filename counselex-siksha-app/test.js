const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const BASE_URL = "http://localhost:3000";
const MEDIA_DIR = "/cursor/stores/bc-96a3c328-5576-4931-85b7-335f6823acd1/media";

async function run() {
  fs.mkdirSync(MEDIA_DIR, { recursive: true });

  const browser = await chromium.launch({
    headless: true,
    executablePath: "/usr/bin/google-chrome-stable",
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
  });

  // 1. Desktop Verification (1440x1080)
  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 1080 } });
  const page = await desktopContext.newPage();

  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  const brandText = await page.textContent(".brand-title");
  assert(brandText.includes("CounselexSiksha"), "Brand logo should say CounselexSiksha");

  const headerLogoSrc = await page.locator("header .brand-logo-img").getAttribute("src");
  const footerLogoSrc = await page.locator("footer .brand-logo-img").getAttribute("src");
  const faviconHref = await page.locator('link[rel="icon"]').getAttribute("href");
  assert.strictEqual(headerLogoSrc, "/images/1-logo.jpg", "Header logo must use /images/1-logo.jpg");
  assert.strictEqual(footerLogoSrc, "/images/1-logo.jpg", "Footer logo must use /images/1-logo.jpg");
  assert.strictEqual(faviconHref, "/images/1-logo.jpg", "Favicon must use /images/1-logo.jpg");

  const searchCount = await page.locator("#globalSearchInput, .header-search-wrap").count();
  assert.strictEqual(searchCount, 0, "Header search bar must be removed");

  const heroBadge = (await page.textContent(".hero-badge")).trim();
  assert.strictEqual(heroBadge, "Admissions Open", "Hero badge should say 'Admissions Open'");

  const carouselSlides = await page.locator("#homeCarouselTrack .carousel-slide").count();
  assert.strictEqual(carouselSlides, 6, "Carousel should have 6 slides");

  const streamCardsCount = await page.locator(".stream-card").count();
  assert.strictEqual(streamCardsCount, 10, "Should render all 10 stream cards on homepage");

  const top10RowsCount = await page.locator(".cd-home-table").first().locator("tbody tr").count();
  assert.strictEqual(top10RowsCount, 10, "Should render 10 rows in Top 10 Colleges table");

  const bbaRankingRowsCount = await page.locator(".cd-home-table").nth(1).locator("tbody tr").count();
  assert.strictEqual(bbaRankingRowsCount, 10, "Should render 10 rows in BBA/BMS College Ranking 2026 table");

  const callHref = await page.locator(".fab-bottom-right-pill a.fab-purple").getAttribute("href");
  const waHref = await page.locator(".fab-bottom-right-pill a.fab-green").getAttribute("href");
  assert.strictEqual(callHref, "tel:+919027589486", "Call FAB must link to tel:+919027589486");
  assert.strictEqual(waHref, "https://wa.me/9027589486", "WhatsApp FAB must link to https://wa.me/9027589486");

  await page.goto(`${BASE_URL}/colleges/btech`, { waitUntil: "networkidle" });
  const btechRows = await page.locator(".cd-listing-table tbody tr").count();
  assert.strictEqual(btechRows, 20, "B.Tech table should have 20 rows");

  await desktopContext.close();

  // 2. Mobile Verification across 360x740, 390x844, and 414x896 (touch/mobile emulation)
  const mobileViewports = [
    { width: 360, height: 740 },
    { width: 390, height: 844 },
    { width: 414, height: 896 }
  ];

  for (const vp of mobileViewports) {
    const mobileCtx = await browser.newContext({
      viewport: vp,
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 2
    });
    const mPage = await mobileCtx.newPage();

    // Check Homepage on Mobile
    await mPage.goto(BASE_URL, { waitUntil: "networkidle" });
    const homeMetrics = await mPage.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const leftFab = document.getElementById("bottomLeftCta").getBoundingClientRect();
      const rightFab = document.querySelector(".fab-bottom-right-pill").getBoundingClientRect();
      const headerLogo = document.querySelector(".brand-logo").getBoundingClientRect();
      const headerBtn = document.querySelector(".header-counseling-btn").getBoundingClientRect();
      return {
        docWidth,
        scrollWidth,
        overflowX: scrollWidth > docWidth,
        fabOverlap: leftFab.right > rightFab.left - 8 && leftFab.bottom > rightFab.top,
        leftFabInViewport: leftFab.left >= 0 && leftFab.right <= docWidth && leftFab.bottom <= window.innerHeight,
        rightFabInViewport: rightFab.left >= 0 && rightFab.right <= docWidth && rightFab.bottom <= window.innerHeight,
        headerOverlap: headerLogo.right > headerBtn.left,
        headerInViewport: headerBtn.right <= docWidth
      };
    });

    assert.strictEqual(
      homeMetrics.overflowX,
      false,
      `Homepage should not overflow horizontally at ${vp.width}x${vp.height}: scrollWidth=${homeMetrics.scrollWidth}, docWidth=${homeMetrics.docWidth}`
    );
    assert.strictEqual(homeMetrics.fabOverlap, false, `FABs should not overlap at ${vp.width}x${vp.height}`);
    assert.strictEqual(homeMetrics.leftFabInViewport, true, `Left FAB must stay within viewport at ${vp.width}x${vp.height}`);
    assert.strictEqual(homeMetrics.rightFabInViewport, true, `Right FAB must stay within viewport at ${vp.width}x${vp.height}`);
    assert.strictEqual(homeMetrics.headerOverlap, false, `Header logo and CTA must not overlap at ${vp.width}x${vp.height}`);
    assert.strictEqual(homeMetrics.headerInViewport, true, `Header CTA must fit inside viewport at ${vp.width}x${vp.height}`);

    if (vp.width === 390 && vp.height === 844) {
      const mobileHomeShot = path.join(MEDIA_DIR, "counselex-mobile-home.png");
      await mPage.screenshot({ path: mobileHomeShot, fullPage: false });
      console.log("Saved mobile homepage screenshot:", mobileHomeShot);
    }

    // Check /colleges/btech on Mobile
    await mPage.goto(`${BASE_URL}/colleges/btech`, { waitUntil: "networkidle" });
    const btechMetrics = await mPage.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const firstCard = document.querySelector(".cd-listing-table tbody tr").getBoundingClientRect();
      return {
        docWidth,
        scrollWidth,
        overflowX: scrollWidth > docWidth,
        firstCardFits: firstCard.left >= 0 && firstCard.right <= docWidth + 1
      };
    });

    assert.strictEqual(
      btechMetrics.overflowX,
      false,
      `B.Tech page should not overflow horizontally at ${vp.width}x${vp.height}: scrollWidth=${btechMetrics.scrollWidth}, docWidth=${btechMetrics.docWidth}`
    );
    assert.strictEqual(
      btechMetrics.firstCardFits,
      true,
      `B.Tech college card must fit within viewport at ${vp.width}x${vp.height}`
    );

    if (vp.width === 390 && vp.height === 844) {
      const mobileBtechShot = path.join(MEDIA_DIR, "counselex-mobile-btech.png");
      await mPage.screenshot({ path: mobileBtechShot, fullPage: false });
      console.log("Saved mobile B.Tech screenshot:", mobileBtechShot);
    }

    // Check Lead Modal on Mobile
    await mPage.tap("#bottomLeftCta");
    await mPage.waitForSelector("#counselingModal:not(.hidden)");
    const modalMetrics = await mPage.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const winHeight = window.innerHeight;
      const card = document.querySelector(".modal-card").getBoundingClientRect();
      const submitBtn = document.getElementById("leadSubmitBtn").getBoundingClientRect();
      return {
        fitsHorizontally: card.left >= 0 && card.right <= docWidth + 1,
        fitsVertically: card.top >= 0 && card.bottom <= winHeight + 1,
        submitTapHeight: submitBtn.height
      };
    });

    assert.strictEqual(
      modalMetrics.fitsHorizontally,
      true,
      `Modal must fit horizontally at ${vp.width}x${vp.height}`
    );
    assert.strictEqual(
      modalMetrics.fitsVertically,
      true,
      `Modal must fit vertically at ${vp.width}x${vp.height}`
    );
    assert(modalMetrics.submitTapHeight >= 44, `Submit button tap height must be >= 44px at ${vp.width}x${vp.height}`);

    if (vp.width === 390 && vp.height === 844) {
      const mobileModalShot = path.join(MEDIA_DIR, "counselex-mobile-modal.png");
      await mPage.screenshot({ path: mobileModalShot, fullPage: false });
      console.log("Saved mobile modal screenshot:", mobileModalShot);
    }

    await mobileCtx.close();
  }

  await browser.close();
  console.log("All desktop and mobile (360x740, 390x844, 414x896) Playwright checks passed!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
