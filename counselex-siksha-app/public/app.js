(function () {
  const CAROUSEL_IMAGES = [
    "/images/3-carousel.jpg",
    "/images/4-carousel.jpg",
    "/images/5-carousel.png",
    "/images/6-carousel.jpg",
    "/images/7-carousel.png",
    "/images/8-carousel.jpg"
  ];

  const state = {
    homepage: null,
    streams: {},
    currentRoute: "/",
    currentStreamSlug: null,
    sortBy: "popularity",
    carouselIndex: 0,
    carouselTimer: null,
    carouselPaused: false
  };

  function escapeHtml(str) {
    return String(str ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getStreamIconSvg(iconName) {
    const icons = {
      gear: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
      briefcase: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
      cpu: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line></svg>`,
      medical: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
      chart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
      flask: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path></svg>`,
      heart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
      globe: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`,
      trending: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>`,
      code: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>`
    };
    return icons[iconName] || icons.gear;
  }

  function updateActiveNavLinks() {
    const links = document.querySelectorAll("[data-stream-nav]");
    links.forEach((el) => {
      const slug = el.getAttribute("data-stream-nav");
      if (state.currentStreamSlug && slug === state.currentStreamSlug) {
        el.classList.add("active");
      } else if (!state.currentStreamSlug && slug === "home") {
        el.classList.add("active");
      } else {
        el.classList.remove("active");
      }
    });
  }

  function formatRankingCell(rankingMain) {
    const match = String(rankingMain || "").match(/^(#\d+[a-z]*\/\d+)\s+(.*)$/i);
    if (!match) {
      return `<span class="ranking-orange-num">${escapeHtml(rankingMain)}</span>`;
    }
    return `<span class="ranking-orange-num">${escapeHtml(match[1])}</span> ${escapeHtml(match[2])}`;
  }

  function stopCarouselTimer() {
    if (state.carouselTimer) {
      clearInterval(state.carouselTimer);
      state.carouselTimer = null;
    }
  }

  function updateCarouselDom() {
    const track = document.getElementById("homeCarouselTrack");
    if (!track) return;
    track.style.transform = `translateX(-${state.carouselIndex * 100}%)`;
    const dots = document.querySelectorAll("[data-carousel-dot]");
    dots.forEach((dot, idx) => {
      if (idx === state.carouselIndex) {
        dot.classList.add("active");
      } else {
        dot.classList.remove("active");
      }
    });
  }

  function startCarouselTimer() {
    stopCarouselTimer();
    state.carouselTimer = setInterval(() => {
      if (state.carouselPaused) return;
      state.carouselIndex = (state.carouselIndex + 1) % CAROUSEL_IMAGES.length;
      updateCarouselDom();
    }, 3000);
  }

  function renderHomepage() {
    const hp = state.homepage;
    if (!hp) return;

    const carouselSlidesHtml = CAROUSEL_IMAGES.map(
      (src, idx) => `
        <div class="carousel-slide" data-slide-index="${idx}">
          <img src="${escapeHtml(src)}" alt="Featured Campus Banner ${idx + 1}" />
        </div>
      `
    ).join("");

    const carouselDotsHtml = CAROUSEL_IMAGES.map(
      (_, idx) => `
        <button
          type="button"
          class="carousel-dot ${idx === state.carouselIndex ? "active" : ""}"
          data-carousel-dot="${idx}"
          aria-label="Go to slide ${idx + 1}"
        ></button>
      `
    ).join("");

    const streamCardsHtml = hp.streams
      .map(
        (s) => `
        <a
          href="/colleges/${escapeHtml(s.slug)}"
          class="stream-card"
          data-nav="/colleges/${escapeHtml(s.slug)}"
          style="background:${escapeHtml(s.color)}; border-color:${escapeHtml(s.borderColor)}; color:${escapeHtml(s.textColor)};"
        >
          <div class="stream-icon-circle" style="background:${escapeHtml(s.iconBg)};">
            ${getStreamIconSvg(s.icon)}
          </div>
          <div>
            <div class="stream-card-name">${escapeHtml(s.name)}</div>
            <div class="stream-card-count">${escapeHtml(s.countText)}</div>
          </div>
        </a>
      `
      )
      .join("");

    const top10RowsHtml = hp.top10Colleges
      .map(
        (c) => `
        <tr
          data-open-modal="true"
          data-modal-college="${escapeHtml(c.name)}"
          data-modal-course="${escapeHtml(c.stream || "BBA")}"
          data-modal-source="Homepage Top 10 Row"
        >
          <td class="home-rank-cell">${escapeHtml(c.rank)}</td>
          <td>
            <div class="home-college-cell">
              <div class="college-emblem" style="background:${escapeHtml(c.logoColor)};">
                ${escapeHtml(c.shortCode)}
              </div>
              <div>
                <div class="home-college-name">${escapeHtml(c.name)}</div>
                <div class="home-college-meta">
                  ${escapeHtml(c.location)} &nbsp;|&nbsp; <span class="star-rating">★ ${escapeHtml(c.rating)}</span>
                </div>
              </div>
            </div>
          </td>
          <td>
            ${
              c.rankingText === "-"
                ? "-"
                : `<div class="agency-rank-badge">
                    <span class="agency-pill-tag">${escapeHtml(c.rankingBadge)}</span>
                    <span>${escapeHtml(c.rankingText)}</span>
                  </div>`
            }
          </td>
          <td>${escapeHtml(c.cutoff)}</td>
          <td>${escapeHtml(c.deadline)}</td>
          <td>
            <div class="home-fees-amount">${escapeHtml(c.fees)}</div>
            <div class="home-fees-sub">${escapeHtml(c.feesLabel)}</div>
          </td>
        </tr>
      `
      )
      .join("");

    const bbaRankingRowsHtml = hp.bbaRankingColleges
      .map(
        (c) => `
        <tr
          data-open-modal="true"
          data-modal-college="${escapeHtml(c.name)}"
          data-modal-course="BBA"
          data-modal-source="BBA/BMS College Ranking 2026 Row"
        >
          <td>
            <div class="home-college-cell">
              <div class="college-emblem" style="background:${escapeHtml(c.logoColor)};">
                ${escapeHtml(c.shortCode)}
              </div>
              <div class="home-college-name">${escapeHtml(c.name)}</div>
            </div>
          </td>
          <td><strong>${escapeHtml(c.ranking)}</strong></td>
          <td>${escapeHtml(c.streams)}</td>
        </tr>
      `
      )
      .join("");

    const appRoot = document.getElementById("appRoot");
    appRoot.innerHTML = `
      <!-- Section 1: Hero Banner -->
      <section class="hero-banner">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="hero-badge">Admissions Open</span>
          <h1 class="hero-title">Find &amp; Compare Top Colleges in India 2026</h1>
          <p class="hero-subtitle">
            Explore verified rankings, course fees, placement packages, cutoffs &amp; get 1-on-1 free admission counseling.
          </p>
          <div class="hero-cta-row">
            <button type="button" class="hero-primary-btn" data-open-modal="true" data-modal-source="Hero Banner CTA">
              📞 Book Free Counseling
            </button>
            <a href="/colleges/btech" class="hero-secondary-btn" data-nav="/colleges/btech">
              Explore Top B.Tech Colleges →
            </a>
          </div>
        </div>
      </section>

      <div class="container">
        <!-- Full-Width Auto-Sliding Carousel Just Above Browse by Stream -->
        <section class="carousel-section" aria-label="Featured Highlights Carousel">
          <div class="carousel-container" id="homeCarouselContainer">
            <div class="carousel-track" id="homeCarouselTrack" style="transform: translateX(-${state.carouselIndex * 100}%);">
              ${carouselSlidesHtml}
            </div>
            <button type="button" class="carousel-arrow prev" data-carousel-dir="-1" aria-label="Previous Slide">&#10094;</button>
            <button type="button" class="carousel-arrow next" data-carousel-dir="1" aria-label="Next Slide">&#10095;</button>
            <div class="carousel-dots">
              ${carouselDotsHtml}
            </div>
          </div>
        </section>

        <!-- Section 2: Browse by Stream -->
        <section class="home-section">
          <div class="section-card">
            <div class="section-header-row">
              <div>
                <h2 class="section-title">Browse by Stream</h2>
                <p class="section-subtitle">Find the right college for your interest</p>
              </div>
            </div>
            <div class="stream-grid">
              ${streamCardsHtml}
            </div>
          </div>
        </section>

        <!-- Section 3: Top 10 Colleges Table -->
        <section class="home-section">
          <div class="section-card">
            <div class="section-header-row">
              <h2 class="section-title">Top 10 Colleges</h2>
            </div>

            <div class="cd-home-table-wrap">
              <table class="cd-home-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>College</th>
                    <th>Ranking</th>
                    <th>Cutoff</th>
                    <th>Application Deadline</th>
                    <th>Total Fees</th>
                  </tr>
                </thead>
                <tbody>
                  ${top10RowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Section 4: BBA/BMS College Ranking 2026 -->
        <section class="home-section">
          <div class="section-card">
            <div class="section-header-row">
              <h2 class="section-title">BBA/BMS College Ranking 2026</h2>
              <a href="/colleges/bba" class="view-all-link" data-nav="/colleges/bba">View all Colleges</a>
            </div>

            <div class="cd-home-table-wrap">
              <table class="cd-home-table">
                <thead>
                  <tr>
                    <th>College</th>
                    <th>Ranking</th>
                    <th>Streams</th>
                  </tr>
                </thead>
                <tbody>
                  ${bbaRankingRowsHtml}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    `;

    const carouselEl = document.getElementById("homeCarouselContainer");
    if (carouselEl) {
      carouselEl.addEventListener("mouseenter", () => {
        state.carouselPaused = true;
      });
      carouselEl.addEventListener("mouseleave", () => {
        state.carouselPaused = false;
      });
    }
    startCarouselTimer();
  }

  function getSortedColleges(colleges) {
    const list = [...colleges];
    return sortCollegeArray(list);
  }

  function sortCollegeArray(arr) {
    if (state.sortBy === "rating") {
      return arr.sort((a, b) => b.ratingNumeric - a.ratingNumeric || a.rank - b.rank);
    }
    if (state.sortBy === "highest_fees") {
      return arr.sort((a, b) => b.feesNumeric - a.feesNumeric);
    }
    if (state.sortBy === "lowest_fees") {
      return arr.sort((a, b) => a.feesNumeric - b.feesNumeric);
    }
    return arr.sort((a, b) => a.rank - b.rank);
  }

  function renderStreamPage(slug) {
    stopCarouselTimer();
    const stream = state.streams[slug];
    if (!stream) {
      renderHomepage();
      return;
    }

    const sortedColleges = getSortedColleges(stream.colleges);

    const rowsHtml = sortedColleges
      .map((c) => {
        const approvalsHtml = (c.approvals || [])
          .map((ap) => {
            if (ap.toUpperCase().includes("NAAC")) {
              return `<span class="naac-pill">${escapeHtml(ap)}</span>`;
            }
            return `<span>| ${escapeHtml(ap)}</span>`;
          })
          .join(" ");

        return `
          <tr
            data-open-modal="true"
            data-modal-college="${escapeHtml(c.name)}"
            data-modal-course="${escapeHtml(stream.name)}"
            data-modal-source="Stream Table Row (${escapeHtml(stream.name)})"
          >
            <td class="col-cd-rank">#${escapeHtml(c.rank)}</td>
            <td class="col-colleges">
              <div class="college-main-flex">
                <div class="college-emblem" style="background:${escapeHtml(c.logoColor)};">
                  ${escapeHtml(c.shortCode)}
                </div>
                <div class="college-info-body">
                  <div class="listing-college-title">${escapeHtml(c.name)}</div>
                  <div class="listing-location-row">
                    <span>${escapeHtml(c.location)}</span>
                    ${approvalsHtml}
                  </div>
                  <div class="listing-actions-row">
                    <span
                      class="action-apply-now"
                      data-open-modal="true"
                      data-modal-college="${escapeHtml(c.name)}"
                      data-modal-course="${escapeHtml(stream.name)}"
                      data-modal-source="Apply Now CTA"
                    >
                      → Apply Now
                    </span>
                    <span
                      class="action-download-brochure"
                      data-open-modal="true"
                      data-modal-college="${escapeHtml(c.name)}"
                      data-modal-course="${escapeHtml(stream.name)}"
                      data-modal-source="Download Brochure CTA"
                    >
                      ⤓ Download Brochure
                    </span>
                    <span
                      class="action-add-compare"
                      data-open-modal="true"
                      data-modal-college="${escapeHtml(c.name)}"
                      data-modal-course="${escapeHtml(stream.name)}"
                      data-modal-source="Add To Compare CTA"
                    >
                      ☐ Add To Compare
                    </span>
                  </div>
                  <div class="cd-score-badge">
                    <span>🎓</span>
                    <span>CD Score: ${escapeHtml(c.cdScore)}</span>
                  </div>
                </div>
              </div>
            </td>
            <td class="col-fees">
              <div class="fee-green-bold">${escapeHtml(c.fees)}</div>
              <div class="fee-course-name">${escapeHtml(c.courseName)}</div>
              <div class="fee-total-label">- Total Fees</div>
              <div
                class="orange-compare-link"
                data-open-modal="true"
                data-modal-college="${escapeHtml(c.name)}"
                data-modal-course="${escapeHtml(stream.name)}"
                data-modal-source="Compare Fees CTA"
              >
                ⇄ Compare Fees
              </div>
            </td>
            <td class="col-placement">
              <div class="pkg-block">
                <div class="pkg-amount">${escapeHtml(c.avgPackage)}</div>
                <div class="pkg-label">Average Package</div>
              </div>
              <div class="pkg-block">
                <div class="pkg-amount">${escapeHtml(c.highPackage)}</div>
                <div class="pkg-label">Highest Package</div>
              </div>
              <div class="placement-pct-pill">${escapeHtml(c.placementRate || "90% Placement")}</div>
              <div>
                <span
                  class="orange-compare-link"
                  data-open-modal="true"
                  data-modal-college="${escapeHtml(c.name)}"
                  data-modal-course="${escapeHtml(stream.name)}"
                  data-modal-source="Compare Placement CTA"
                >
                  ⇄ Compare Placement
                </span>
              </div>
            </td>
            <td class="col-reviews">
              <div class="review-score-row">
                <span class="orange-dot"></span>
                <span>${escapeHtml(c.rating)}</span>
              </div>
              <div class="review-count-sub">Based on ${escapeHtml(c.reviewsCount)} User Reviews</div>
              <div class="best-in-pill">✓ ${escapeHtml(c.bestIn)} ⌄</div>
            </td>
            <td class="col-ranking">
              <div class="ranking-main-text">
                ${formatRankingCell(c.rankingMain)}
              </div>
              <div class="more-rankings-pill">${escapeHtml(c.moreRankings)} ⌄</div>
            </td>
          </tr>
        `;
      })
      .join("");

    const appRoot = document.getElementById("appRoot");
    appRoot.innerHTML = `
      <div class="container stream-landing-container">
        <div class="stream-page-breadcrumb">
          <a href="/" data-nav="/">Home</a> &nbsp;/&nbsp; <span>${escapeHtml(stream.name)} Colleges</span>
        </div>
        <h1 class="stream-page-h1">${escapeHtml(stream.title)}</h1>

        <!-- Top Bar: Found <N> Colleges + Sort By + View Toggle Icons -->
        <div class="stream-top-bar">
          <div class="found-colleges-text">
            Found <span class="found-colleges-count">${escapeHtml(stream.foundCount)}</span> Colleges
          </div>

          <div class="sort-controls-right">
            <span class="sort-by-label">Sort By</span>
            <div class="sort-radio-group">
              <label class="sort-radio-item">
                <input type="radio" name="sortColleges" value="popularity" ${state.sortBy === "popularity" ? "checked" : ""} />
                <span>Popularity</span>
              </label>
              <label class="sort-radio-item">
                <input type="radio" name="sortColleges" value="rating" ${state.sortBy === "rating" ? "checked" : ""} />
                <span>Rating</span>
              </label>
              <label class="sort-radio-item">
                <input type="radio" name="sortColleges" value="highest_fees" ${state.sortBy === "highest_fees" ? "checked" : ""} />
                <span>Highest Fees</span>
              </label>
              <label class="sort-radio-item">
                <input type="radio" name="sortColleges" value="lowest_fees" ${state.sortBy === "lowest_fees" ? "checked" : ""} />
                <span>Lowest Fees</span>
              </label>
            </div>

            <div class="view-toggle-group">
              <button type="button" class="view-icon-btn active" title="Table List View" aria-label="List View">
                ☰
              </button>
              <button type="button" class="view-icon-btn" title="Grid View" aria-label="Grid View" data-open-modal="true" data-modal-course="${escapeHtml(stream.name)}" data-modal-source="View Toggle">
                ⊞
              </button>
            </div>
          </div>
        </div>

        <!-- Teal Header Collegedunia Table -->
        <div class="cd-listing-table-wrap">
          <table class="cd-listing-table">
            <thead>
              <tr>
                <th>CD Rank</th>
                <th>Colleges</th>
                <th>Course Fees</th>
                <th>Placement</th>
                <th>User Reviews</th>
                <th>Ranking</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function openCounselingModal(options = {}) {
    const modal = document.getElementById("counselingModal");
    const form = document.getElementById("leadCaptureForm");
    const successState = document.getElementById("modalSuccessState");
    const errorBox = document.getElementById("formErrorMsg");
    const courseSelect = document.getElementById("leadCourse");
    const collegeInput = document.getElementById("leadCollegeInput");
    const sourceInput = document.getElementById("leadSourceInput");
    const subtitle = document.getElementById("modalSubtitle");

    form.classList.remove("hidden");
    successState.classList.add("hidden");
    errorBox.classList.add("hidden");

    const defaultCourse =
      options.course ||
      (state.currentStreamSlug && state.streams[state.currentStreamSlug]
        ? state.streams[state.currentStreamSlug].name
        : "B.Tech");

    if (courseSelect) {
      const matchingOption = Array.from(courseSelect.options).find(
        (opt) => opt.value.toLowerCase() === String(defaultCourse).toLowerCase()
      );
      if (matchingOption) {
        courseSelect.value = matchingOption.value;
      }
    }

    collegeInput.value = options.college || "";
    sourceInput.value = options.source || "Free Counseling Modal";

    if (options.college) {
      subtitle.textContent = `Enquiring for ${options.college} (${courseSelect.value}). Get instant fee details, cutoff & admission support.`;
    } else {
      subtitle.textContent =
        "Get personalized college shortlisting, fee breakdown & scholarship assistance from our senior counselors.";
    }

    modal.classList.remove("hidden");
  }

  function closeCounselingModal() {
    const modal = document.getElementById("counselingModal");
    modal.classList.add("hidden");
  }

  function resolveRoute(pathname, push = false) {
    if (push && window.location.pathname !== pathname) {
      window.history.pushState({}, "", pathname);
    }
    state.currentRoute = pathname;
    if (pathname.startsWith("/colleges/")) {
      const slug = pathname.replace("/colleges/", "").split("/")[0].trim().toLowerCase();
      state.currentStreamSlug = slug;
      updateActiveNavLinks();
      renderStreamPage(slug);
      window.scrollTo({ top: 0, behavior: "instant" });
    } else {
      state.currentStreamSlug = null;
      updateActiveNavLinks();
      renderHomepage();
      window.scrollTo({ top: 0, behavior: "instant" });
    }
  }

  function bindEvents() {
    document.addEventListener("click", (e) => {
      const carouselDirBtn = e.target.closest("[data-carousel-dir]");
      if (carouselDirBtn) {
        e.preventDefault();
        const dir = Number(carouselDirBtn.getAttribute("data-carousel-dir")) || 1;
        state.carouselIndex = (state.carouselIndex + dir + CAROUSEL_IMAGES.length) % CAROUSEL_IMAGES.length;
        updateCarouselDom();
        startCarouselTimer();
        return;
      }

      const carouselDotBtn = e.target.closest("[data-carousel-dot]");
      if (carouselDotBtn) {
        e.preventDefault();
        state.carouselIndex = Number(carouselDotBtn.getAttribute("data-carousel-dot")) || 0;
        updateCarouselDom();
        startCarouselTimer();
        return;
      }

      const modalTrigger = e.target.closest("[data-open-modal='true']");
      if (modalTrigger) {
        e.preventDefault();
        e.stopPropagation();
        openCounselingModal({
          college: modalTrigger.getAttribute("data-modal-college") || "",
          course: modalTrigger.getAttribute("data-modal-course") || "",
          source: modalTrigger.getAttribute("data-modal-source") || "Site CTA"
        });
        return;
      }

      const navLink = e.target.closest("[data-nav]");
      if (navLink) {
        e.preventDefault();
        const targetPath = navLink.getAttribute("data-nav");
        resolveRoute(targetPath, true);
        return;
      }
    });

    document.addEventListener("change", (e) => {
      if (e.target && e.target.name === "sortColleges") {
        state.sortBy = e.target.value;
        if (state.currentStreamSlug) {
          renderStreamPage(state.currentStreamSlug);
        }
      }
    });

    const closeBtn = document.getElementById("closeModalBtn");
    const doneBtn = document.getElementById("modalDoneBtn");
    const modalOverlay = document.getElementById("counselingModal");

    closeBtn.addEventListener("click", closeCounselingModal);
    doneBtn.addEventListener("click", closeCounselingModal);
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        closeCounselingModal();
      }
    });

    const leadForm = document.getElementById("leadCaptureForm");
    leadForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const fullName = document.getElementById("leadFullName").value.trim();
      const phone = document.getElementById("leadPhone").value.trim();
      const email = document.getElementById("leadEmail").value.trim();
      const course = document.getElementById("leadCourse").value;
      const city = document.getElementById("leadCity").value.trim();
      const college = document.getElementById("leadCollegeInput").value.trim();
      const source = document.getElementById("leadSourceInput").value.trim();
      const errorBox = document.getElementById("formErrorMsg");
      const submitBtn = document.getElementById("leadSubmitBtn");

      if (!fullName || !phone) {
        errorBox.textContent = "Please enter your Full Name and Phone Number.";
        errorBox.classList.remove("hidden");
        return;
      }

      errorBox.classList.add("hidden");
      submitBtn.disabled = true;
      submitBtn.textContent = "Submitting...";

      const universityParts = [course, city, college].map((s) => s.trim()).filter(Boolean);
      const university = universityParts.length > 0 ? universityParts.join(" | ") : course;

      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: fullName,
            fullName,
            phone,
            email,
            course,
            city,
            college,
            university,
            source
          })
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          throw new Error(data.message || "Submission failed");
        }
        leadForm.reset();
        leadForm.classList.add("hidden");
        document.getElementById("modalSuccessMessage").textContent =
          data.message || "Thank you! Our senior admission counselor will call you shortly.";
        document.getElementById("modalSuccessState").classList.remove("hidden");
      } catch (err) {
        errorBox.textContent = err.message || "Could not submit form. Please try again.";
        errorBox.classList.remove("hidden");
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Submit";
      }
    });

    window.addEventListener("popstate", () => {
      resolveRoute(window.location.pathname, false);
    });
  }

  async function init() {
    bindEvents();
    try {
      const res = await fetch("/api/data");
      const payload = await res.json();
      if (payload && payload.ok) {
        state.homepage = payload.homepage;
        state.streams = payload.streams;
        resolveRoute(window.location.pathname, false);
      }
    } catch (err) {
      console.error("Failed to load initial data:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
