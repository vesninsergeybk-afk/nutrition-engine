// V6 UI audit harness — measurement only, no product logic.
//
// Captures objective readability/ergonomics metrics, a screen-by-screen visual
// walk and the print-media rendering of every workspace route. Output goes to
// reports/ui-audit/ and is intentionally not committed: the committed artefact is
// the written assessment that quotes these numbers.
//
// Run:
//   npx playwright test tests/e2e/ui-audit-capture.spec.js --project=chromium

const { test, expect } = require('./fixtures');
const fs = require('node:fs');
const path = require('node:path');

const OUT = path.join(__dirname, '..', '..', 'reports', 'ui-audit');
const SHOTS = path.join(OUT, 'shots');

const ROUTES = [
  'profile',
  'ration',
  'analysis/overview',
  'analysis/nutrients',
  'analysis/hei',
  'correction',
  'report'
];

const VIEWPORTS = [
  { name: 'mobile', width: 390, height: 844, walk: 5, shots: true },
  { name: 'tablet', width: 820, height: 1180, walk: 0, shots: false },
  { name: 'desktop', width: 1440, height: 1000, walk: 3, shots: true }
];

// Print layout is audited for the two screens that are meant to be printable.
const PRINT_ROUTES = new Set(['ration', 'report']);

const collected = [];

async function waitForApp(page) {
  await page.waitForFunction(() => {
    const meta = window.__APP_BOOTSTRAP_META__;
    return !!meta && meta.status === 'ready' &&
      window.__RUNTIME_LOADER_CLOSED__ === true &&
      document.documentElement.getAttribute('data-interface-simplification') === '1';
  }, null, { timeout: 30000 });
  await page.waitForFunction(() => !!window.NavigationShellV1, null, { timeout: 15000 });
}

async function navigate(page, route) {
  await page.evaluate(name => {
    if (!window.NavigationShellV1 || typeof window.NavigationShellV1.navigate !== 'function') {
      throw new Error('NavigationShellV1.navigate is unavailable');
    }
    window.NavigationShellV1.navigate(name);
  }, route);
  await page.waitForFunction(name =>
    document.documentElement.getAttribute('data-navigation-route') === name,
    route, { timeout: 10000 });
  // Panels hydrate asynchronously (HEI, correction and report build their bodies
  // after the route event), so measurements must wait until the page height stops
  // moving. Without this the same route can be measured at two different heights.
  await page.waitForFunction(() => {
    const height = document.documentElement.scrollHeight;
    const previous = window.__uiAuditLastHeight;
    window.__uiAuditLastHeight = height;
    return previous === height;
  }, null, { timeout: 8000, polling: 250 }).catch(() => {});
  await page.waitForTimeout(250);
}

// Measures only what a user can perceive: geometry, type scale, tap targets,
// duplicated wording and how much scrolling a screen demands.
async function collect(page, route, viewport) {
  return page.evaluate(({ routeName, viewportName, touch }) => {
    const isVisible = node => {
      if (!node || node.nodeType !== 1) return false;
      if (node.closest('[aria-hidden="true"]')) return false;
      let current = node;
      while (current && current.nodeType === 1) {
        const style = getComputedStyle(current);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
        // opacity does not inherit: an element inside a faded-out ancestor still
        // reports opacity 1 and a normal rectangle, so the chain must be walked.
        if (Number(style.opacity) < 0.05) return false;
        if (current === document.body) break;
        current = current.parentElement;
      }
      const rect = node.getBoundingClientRect();
      return rect.width > 1 && rect.height > 1;
    };
    // A collapsed wrapper (height 0 plus overflow hidden) still gives its children
    // a normal rectangle, so clipping has to be detected explicitly.
    const clippedAway = node => {
      const own = node.getBoundingClientRect();
      let current = node.parentElement;
      while (current && current !== document.body) {
        const style = getComputedStyle(current);
        const clipsY = style.overflowY !== 'visible';
        const clipsX = style.overflowX !== 'visible';
        if (clipsY || clipsX) {
          const box = current.getBoundingClientRect();
          if (clipsY && (own.bottom <= box.top + 0.5 || own.top >= box.bottom - 0.5)) return true;
          if (clipsX && (own.right <= box.left + 0.5 || own.left >= box.right - 0.5)) return true;
        }
        current = current.parentElement;
      }
      return false;
    };
    const text = node => (node.textContent || '').replace(/\s+/g, ' ').trim();
    const all = Array.from(document.querySelectorAll('body *')).filter(node => isVisible(node) && !clippedAway(node));
    const box = node => {
      const rect = node.getBoundingClientRect();
      return { w: Math.round(rect.width), h: Math.round(rect.height) };
    };

    const interactive = all.filter(node =>
      node.matches('button, a[href], input, select, textarea, summary, [role="button"], [role="tab"], [role="switch"]'));

    const smallTaps = interactive
      .map(node => {
        const size = box(node);
        return { label: text(node).slice(0, 40) || node.id || node.tagName.toLowerCase(), ...size };
      })
      // On touch widths the 40px target rule applies; on pointer widths only
      // genuinely tiny hit areas are flagged.
      .filter(item => touch ? (item.h < 40 || item.w < 28) : (item.h < 24 || item.w < 24));

    const smallText = all
      .filter(node => {
        if (!node.textContent || !node.textContent.trim()) return false;
        if (node.children.length) return false;
        const size = parseFloat(getComputedStyle(node).fontSize);
        return size > 0 && size < 12;
      })
      .map(node => ({ label: text(node).slice(0, 40), size: parseFloat(getComputedStyle(node).fontSize) }));

    const headings = all
      .filter(node => /^H[1-4]$/.test(node.tagName))
      .map(node => ({ tag: node.tagName, label: text(node).slice(0, 80) }));

    const labels = interactive.map(text).filter(Boolean);
    const duplicateLabels = Object.entries(
      labels.reduce((acc, label) => {
        const key = label.slice(0, 60);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {})
    ).filter(([, count]) => count > 1).map(([label, count]) => ({ label, count }));

    // The mobile bottom navigation is the most used control on touch devices,
    // so its geometry and type scale are measured explicitly.
    const bottomNav = document.getElementById('navigationShell');
    const bottomNavVisible = !!bottomNav && isVisible(bottomNav);
    const navMetrics = bottomNavVisible ? {
      height: box(bottomNav).h,
      labelFontSize: (() => {
        const span = bottomNav.querySelector('span');
        return span ? parseFloat(getComputedStyle(span).fontSize) : null;
      })(),
      itemCount: bottomNav.querySelectorAll('a, button').length
    } : null;

    const root = document.documentElement;
    const body = document.body;
    const pageHeight = Math.max(root.scrollHeight, body ? body.scrollHeight : 0);
    const viewportHeight = window.innerHeight;

    return {
      route: routeName,
      viewport: viewportName,
      viewportSize: { width: window.innerWidth, height: viewportHeight },
      horizontalOverflowPx: root.scrollWidth - root.clientWidth,
      pageHeightPx: pageHeight,
      screensOfScroll: Number((pageHeight / viewportHeight).toFixed(2)),
      visibleElements: all.length,
      interactiveCount: interactive.length,
      buttonCount: interactive.filter(n => n.tagName === 'BUTTON').length,
      headingCount: headings.length,
      headings,
      smallTapTargetCount: smallTaps.length,
      smallTapTargets: smallTaps.slice(0, 30),
      smallTextCount: smallText.length,
      smallText: smallText.slice(0, 30),
      duplicateLabelCount: duplicateLabels.length,
      duplicateLabels: duplicateLabels.slice(0, 20),
      bottomNav: navMetrics,
      state: {
        navigationShell: root.getAttribute('data-navigation-shell'),
        route: root.getAttribute('data-navigation-route'),
        theme: root.getAttribute('data-theme'),
        rationEmpty: root.getAttribute('data-ration-empty')
      }
    };
  }, { routeName: route, viewportName: viewport.name, touch: viewport.name !== 'desktop' });
}

test('UI audit captures metrics, screen walk and print rendering', async ({ page, loadApp }) => {
  test.setTimeout(900000);
  fs.mkdirSync(SHOTS, { recursive: true });

  await loadApp();
  await waitForApp(page);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(250);

    for (const route of ROUTES) {
      await navigate(page, route);

      collected.push(await collect(page, route, viewport));

      if (!viewport.shots) continue;
      const slug = `${viewport.name}-${route.replace('/', '-')}`;

      for (let screen = 0; screen < viewport.walk; screen += 1) {
        const reached = await page.evaluate(top => {
          window.scrollTo(0, top);
          return Math.round(window.scrollY);
        }, screen * viewport.height);
        await page.waitForTimeout(180);
        await page.screenshot({ path: path.join(SHOTS, `${slug}-s${screen + 1}.png`) });
        const atBottom = await page.evaluate(() =>
          Math.round(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 2);
        if (atBottom) break;
        if (reached < screen * viewport.height - 2) break;
      }

      if (PRINT_ROUTES.has(route)) {
        await page.emulateMedia({ media: 'print' });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.waitForTimeout(200);
        await page.screenshot({ path: path.join(SHOTS, `${slug}-print.png`) });
        await page.emulateMedia({ media: 'screen' });
      }

      await page.evaluate(() => window.scrollTo(0, 0));
    }
  }

  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({
    generated_by: 'tests/e2e/ui-audit-capture.spec.js',
    route_count: ROUTES.length,
    viewport_count: VIEWPORTS.length,
    entries: collected
  }, null, 2) + '\n', 'utf8');

  expect(collected.length).toBe(ROUTES.length * VIEWPORTS.length);
});

// A second pass records what the eye would see: the ordered list of visible
// blocks with their type scale and measured colour contrast. Screenshots are for
// humans; these numbers are what an assessment can actually reason about.
test('UI audit captures the visible outline, type scale and contrast', async ({ page, loadApp }) => {
  test.setTimeout(900000);
  const OUTLINE = path.join(OUT, 'outline');
  fs.mkdirSync(OUTLINE, { recursive: true });

  await loadApp();
  await waitForApp(page);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.waitForTimeout(250);

    for (const route of ROUTES) {
      await navigate(page, route);

      const outline = await page.evaluate(() => {
        const parseColor = value => {
          const match = String(value).match(/rgba?\(([^)]+)\)/);
          if (!match) return null;
          const parts = match[1].split(',').map(part => parseFloat(part.trim()));
          return { r: parts[0], g: parts[1], b: parts[2], a: parts.length > 3 ? parts[3] : 1 };
        };
        const luminance = color => {
          const channel = value => {
            const c = value / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
          };
          return 0.2126 * channel(color.r) + 0.7152 * channel(color.g) + 0.0722 * channel(color.b);
        };
        const contrast = (fg, bg) => {
          const a = luminance(fg);
          const b = luminance(bg);
          return Number((((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05))).toFixed(2));
        };
        const backgroundOf = node => {
          let current = node;
          while (current && current.nodeType === 1) {
            const style = getComputedStyle(current);
            const color = parseColor(style.backgroundColor);
            const hasImage = !!style.backgroundImage && style.backgroundImage !== 'none';
            if (color && color.a > 0.5) {
              if (color.a >= 0.999) return { color, image: hasImage };
              return {
                color: {
                  r: color.r * color.a + 255 * (1 - color.a),
                  g: color.g * color.a + 255 * (1 - color.a),
                  b: color.b * color.a + 255 * (1 - color.a),
                  a: 1
                },
                image: hasImage
              };
            }
            // A gradient or image backdrop cannot be averaged into one colour, so
            // the contrast of anything painted on it is reported as unreliable
            // instead of being guessed.
            if (hasImage) return { color: null, image: true };
            current = current.parentElement;
          }
          return { color: { r: 255, g: 255, b: 255, a: 1 }, image: false };
        };
        const styleCache = new WeakMap();
        const styleOf = node => {
          if (!styleCache.has(node)) styleCache.set(node, getComputedStyle(node));
          return styleCache.get(node);
        };
        const visible = node => {
          if (!node || node.nodeType !== 1) return false;
          if (node.closest('[aria-hidden="true"]')) return false;
          let current = node;
          while (current && current.nodeType === 1) {
            const style = styleOf(current);
            if (style.display === 'none' || style.visibility === 'hidden') return false;
            // opacity does not inherit: an element inside a faded-out ancestor still
            // reports opacity 1 and a normal rectangle, so the chain must be walked.
            if (Number(style.opacity) < 0.05) return false;
            if (current === document.body) break;
            current = current.parentElement;
          }
          const rect = node.getBoundingClientRect();
          return rect.width > 1 && rect.height > 1;
        };
        // A collapsed wrapper (height 0 plus overflow hidden) still gives its children
        // a normal rectangle, so clipping has to be detected explicitly.
        const clipped = node => {
          const own = node.getBoundingClientRect();
          let current = node.parentElement;
          while (current && current !== document.body) {
            const style = styleOf(current);
            const clipsY = style.overflowY !== 'visible';
            const clipsX = style.overflowX !== 'visible';
            if (clipsY || clipsX) {
              const box = current.getBoundingClientRect();
              if (clipsY && (own.bottom <= box.top + 0.5 || own.top >= box.bottom - 0.5)) return true;
              if (clipsX && (own.right <= box.left + 0.5 || own.left >= box.right - 0.5)) return true;
            }
            current = current.parentElement;
          }
          return false;
        };
        const clean = value => (value || '').replace(/\s+/g, ' ').trim();
        const isLeafText = node => clean(node.textContent).length > 0 &&
          !Array.from(node.children).some(child => clean(child.textContent).length > 0);

        const entries = [];
        const nodes = Array.from(document.querySelectorAll('body *'));
        for (const node of nodes) {
          if (!visible(node) || clipped(node)) continue;
          const interesting = isLeafText(node) ||
            /^H[1-4]$/.test(node.tagName) ||
            node.matches('button, a[href], summary, [role="button"]');
          if (!interesting) continue;

          const text = clean(node.textContent);
          if (!text) continue;

          const style = styleOf(node);
          const rect = node.getBoundingClientRect();
          const fg = parseColor(style.color) || { r: 0, g: 0, b: 0, a: 1 };
          const bg = backgroundOf(node);
          let effectiveFg = fg;
          if (fg.a < 0.999 && bg.color) {
            effectiveFg = {
              r: fg.r * fg.a + bg.color.r * (1 - fg.a),
              g: fg.g * fg.a + bg.color.g * (1 - fg.a),
              b: fg.b * fg.a + bg.color.b * (1 - fg.a),
              a: 1
            };
          }

          const threshold = (parseFloat(style.fontSize) >= 24 ||
            (parseFloat(style.fontSize) >= 18.66 && Number(style.fontWeight) >= 700)) ? 3 : 4.5;
          const contrastValue = (bg.color && !bg.image) ? contrast(effectiveFg, bg.color) : null;

          // A low contrast number only matters if the run is genuinely painted.
          // Hidden twins of the same label (a KPI copy inside a collapsed nav block,
          // for example) would otherwise be reported as unreadable text.
          let paintedOnTop = null;
          const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
          if (contrastValue !== null && contrastValue < threshold && inViewport) {
            const hit = document.elementFromPoint(
              rect.left + rect.width / 2,
              Math.max(0, Math.min(window.innerHeight - 1, rect.top + rect.height / 2))
            );
            // The run must be the hit target itself (or contain it); an ancestor
            // winning the hit test means something else is painted at that point.
            paintedOnTop = !!(hit && (hit === node || node.contains(hit)));
          }

          entries.push({
            tag: node.tagName,
            id: node.id || '',
            cls: String(node.className || '').split(/\s+/).filter(Boolean).slice(0, 3).join('.'),
            text: text.slice(0, 140),
            fontSize: parseFloat(style.fontSize),
            fontWeight: style.fontWeight,
            color: style.color,
            textFill: style.webkitTextFillColor || '',
            background: bg.color
              ? `rgb(${Math.round(bg.color.r)}, ${Math.round(bg.color.g)}, ${Math.round(bg.color.b)})`
              : null,
            backgroundImage: !!bg.image,
            // Contrast is only reported when the backdrop is a single solid colour:
            // gradients, images and gradient-clipped text cannot be averaged.
            contrast: contrastValue,
            contrastReliable: !!bg.color && !bg.image,
            paintedOnTop,
            top: Math.round(rect.top + window.scrollY),
            height: Math.round(rect.height),
            interactive: node.matches('button, a[href], summary, [role="button"]')
          });
        }
        return {
          route: document.documentElement.getAttribute('data-navigation-route'),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          entries
        };
      });

      outline.requestedRoute = route;
      outline.viewportName = viewport.name;
      fs.writeFileSync(
        path.join(OUTLINE, `${viewport.name}-${route.replace('/', '-')}.json`),
        JSON.stringify(outline, null, 2) + '\n',
        'utf8'
      );
    }
  }
});
