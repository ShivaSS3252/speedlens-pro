import { Injectable } from '@nestjs/common';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { v4 as uuidv4 } from 'uuid';

const DESKTOP_OPTIONS = {
  formFactor: 'desktop' as const,
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

@Injectable()
export class LighthouseService {
  /**
   * Launches headless Chrome and runs two Lighthouse audits sequentially —
   * one with mobile emulation (default) and one with desktop settings.
   * Returns both raw lhr objects so scores and audits can be compared.
   */
  async run(url: string): Promise<{ mobile: any; desktop: any }> {
    const chrome = await launch({
      chromeFlags: [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-zygote',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-background-networking',
        '--disable-default-apps',
        '--mute-audio',
      ],
    });

    try {
      const base = {
        logLevel: 'error' as const,
        output: 'json' as const,
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

  /**
   * Converts both mobile and desktop Lighthouse results into the Report shape.
   *
   * Scores are extracted independently for each device.
   * Failing audits from both runs are merged and deduplicated by audit id —
   * so an issue that appears on both devices is listed only once.
   */
  transform(url: string, { mobile, desktop }: { mobile: any; desktop: any }) {
    const mobileScore = Math.round((mobile.categories?.performance?.score ?? 0) * 100);
    const desktopScore = Math.round((desktop.categories?.performance?.score ?? 0) * 100);

    // Walk both result sets and collect every failing audit, deduped by id.
    const seen = new Map<string, any>();

    for (const lhr of [mobile, desktop]) {
      for (const [key, audit] of Object.entries(lhr.audits) as [string, any][]) {
        if (audit.score === null || audit.score >= 0.9 || seen.has(key)) continue;

        seen.set(key, {
          id: key,
          title: audit.title ?? key,
          description: this.stripMarkdown(audit.description ?? ''),
          displayValue: audit.displayValue ?? null,
          // Audits that measured something carry a displayValue or structured
          // details; the rest are opportunity hints without hard metrics.
          _hasMeasurement: !!(audit.displayValue || audit.details),
        });
      }
    }

    const issues: any[] = [];
    const suggestions: any[] = [];

    for (const { _hasMeasurement, ...item } of seen.values()) {
      if (_hasMeasurement) {
        issues.push(item);
      } else {
        suggestions.push(item);
      }
    }

    return { id: uuidv4(), url, mobileScore, desktopScore, issues, suggestions };
  }

  private stripMarkdown(text: string): string {
    return text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }
}
