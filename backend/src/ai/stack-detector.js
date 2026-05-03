/**
 * Detects the tech stack of a website by fetching its HTML and inspecting
 * response headers and page content. Used to tailor code fixes to the
 * actual framework in use.
 */
export async function detectStack(url) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(6000),
      headers: { 'User-Agent': 'SpeedLens-Pro/1.0 (performance audit)' },
    });

    const html = await response.text();
    const poweredBy = response.headers.get('x-powered-by') ?? '';
    const generator = response.headers.get('x-generator') ?? '';
    const server = response.headers.get('server') ?? '';

    if (/next\.js/i.test(poweredBy) || html.includes('__NEXT_DATA__') || html.includes('_next/static')) {
      return 'Next.js';
    }
    if (html.includes('nuxt') || html.includes('__nuxt') || html.includes('_nuxt/')) {
      return 'Nuxt.js';
    }
    if (/wordpress/i.test(generator) || html.includes('wp-content') || html.includes('wp-includes')) {
      return 'WordPress';
    }
    if (html.includes('gatsby') || html.includes('___gatsby')) {
      return 'Gatsby';
    }
    if (html.includes('data-reactroot') || html.includes('react-root')) {
      return 'React';
    }
    if (/angular/i.test(html) && html.includes('ng-version')) {
      return 'Angular';
    }
    if (html.includes('__svelte') || /svelte/i.test(poweredBy)) {
      return 'Svelte';
    }
    if (/django|python/i.test(poweredBy) || html.includes('csrfmiddlewaretoken')) {
      return 'Django';
    }
    if (/express|node\.js/i.test(poweredBy)) {
      return 'Node.js/Express';
    }
    if (/php/i.test(poweredBy) || /php/i.test(server)) {
      return 'PHP';
    }

    return 'HTML/CSS/JS';
  } catch {
    return 'HTML/CSS/JS';
  }
}
