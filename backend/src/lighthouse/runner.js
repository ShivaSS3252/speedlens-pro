import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

const DESKTOP_OPTIONS = {
  formFactor: 'desktop',
  screenEmulation: {
    mobile: false,
    width: 1350,
    height: 940,
    deviceScaleFactor: 1,
    disabled: false,
  },
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 0,
    uploadThroughputKbps: 0,
  },
};

/**
 * Launches headless Chrome and runs two Lighthouse audits sequentially —
 * one with mobile emulation (default) and one with desktop settings.
 * Returns both raw lhr objects so scores and audits can be compared.
 *
 * @param {string} url
 * @returns {Promise<{ mobile: object, desktop: object }>}
 */
export async function runLighthouse(url) {
  const chrome = await launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  try {
    const base = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
    };

    // Run sequentially — two concurrent Lighthouse runs on the same port
    // can interfere with each other.
    const mobileResult = await lighthouse(url, base);
    const desktopResult = await lighthouse(url, { ...base, ...DESKTOP_OPTIONS });

    return {
      mobile: mobileResult.lhr,
      desktop: desktopResult.lhr,
    };
  } finally {
    await chrome.kill();
  }
}
