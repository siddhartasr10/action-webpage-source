import * as core from '@actions/core';
import * as puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';

async function waitForPageStable(page: puppeteer.Page, timeout: number = 30000): Promise<void> {
  const startTime = Date.now();
  
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => {});
  
  const checkStable = async (): Promise<boolean> => {
    const isStable = await page.evaluate(() => {
      const navEntry = performance.getEntriesByType('navigation')[0] as any;
      return (
        document.readyState === 'complete' &&
        navEntry?.loadEventEnd > 0
      );
    });
    return isStable;
  };
  
  while (Date.now() - startTime < timeout) {
    const isStable = await checkStable();
    if (isStable) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const stillStable = await checkStable();
      if (stillStable) {
        return;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  core.warning('Page stability check timed out, proceeding with screenshot');
}

async function run() {
  try {
    const website = core.getInput('website', { required: true });

    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/google-chrome-stable';

    core.info(`Launching browser with executable path: ${executablePath}`);

    const browser = await puppeteer.launch({
      executablePath: executablePath,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });
    const page = await browser.newPage();

    let css = "";

    page.on('response', async (response) => {
      if (response.request().resourceType() !== 'stylesheet') return;
      css += await response.text();
    });

    await page.goto(website, { waitUntil: 'domcontentloaded' });
    core.info('Waiting for page to stabilize...');
    await waitForPageStable(page);
    
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const pageTitle = await page.title();

    // const snapshotDir = path.join(process.cwd(), 'snapshots');
    const Rootdir = path.join(process.cwd(), 'sites');
    if (!fs.existsSync(Rootdir)) {
      fs.mkdirSync(Rootdir, { recursive: true });
    }
    
    const sourceDir = path.join(Rootdir, `${pageTitle}-${timestamp}`);
    if (!fs.existsSync(sourceDir)) {
      fs.mkdirSync(sourceDir, { recursive: true });
    }

    
    // const filename = `snapshot-${timestamp}.png`;
    const htmlFilename = `${pageTitle}.html`;
    const htmlPath = path.join(sourceDir, htmlFilename); // this was snapshotPath 
    const html = await page.content();

    const cssFilename = 'style.css';
    const cssPath = path.join(sourceDir, cssFilename);
    // await page.screenshot({ path: snapshotPath, fullPage: true });
    fs.writeFileSync(htmlPath, html);
    fs.writeFileSync(cssPath, css);
    // const viewport = page.viewport();
    // const imageSize = `${viewport?.width || 1920}x${viewport?.height || 1080}`;
    
    await browser.close();
    
    const time = new Date().toISOString();
    
    core.setOutput('html-path', html);
    core.setOutput('time', time);
    core.setOutput('status', 'success');

    // core.setOutput('image-size', imageSize);
    // core.info(`Image size: ${imageSize}`);

    core.info(`Snapshot saved to: ${htmlPath}`);
    core.info(`Status: success`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Error: ${errorMessage}`);
    
    core.setOutput('status', 'failed');
    core.setOutput('time', new Date().toISOString());
    core.setOutput('snapshot-path', '');
    core.setOutput('image-size', '');
  }
}

run();
