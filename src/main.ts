import * as core from '@actions/core';
import * as puppeteer from 'puppeteer-core';
import * as fs from 'fs';
import * as path from 'path';
import * as jsdom from 'jsdom';

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
    const websites = fs.readFileSync(path.join(__dirname, "websites.txt")).toString()
      .trimEnd()
      .split("\n");
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
    let css = "", finishedSrcPaths = [];

    page.on('response', async (response) => {
      if (response.request().resourceType() !== 'stylesheet') return;
      css += await response.text();
    });

    const Rootdir = path.join(process.cwd(), 'sites');
    if (!fs.existsSync(Rootdir)) fs.mkdirSync(Rootdir, { recursive: true });

    for (let i = 0; i < websites.length; i++) {
      css = "";

      await page.goto(websites[i], { waitUntil: 'domcontentloaded' });
      core.info(`Waiting for page: ${websites[i]} to stabilize...`);
      await waitForPageStable(page);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pageTitle = await page.title();

      // const snapshotDir = path.join(process.cwd(), 'snapshots');
      const hostname = new URL(websites[i]).hostname;

      const sourceDir = path.join(Rootdir, hostname);
      if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir, { recursive: true });

      // const filename = `snapshot-${timestamp}.png`;
      const htmlFilename = `${pageTitle}-${timestamp}.html`;
      const htmlPath = path.join(sourceDir, htmlFilename); // this was snapshotPath 
      let html = await page.content();
      
      // We search for the head tag and kinda do a split but with slice, as split removes the splitted element.
      // We add manually a stylesheet that links to our recovered CSS.
      const headStartIdx = html.match("<head>")?.index;
      let htmlSecondHalf = "";
      if (!headStartIdx) {
        core.info(`Head tag of ${hostname} cannot be found. It's CSS won't be loaded.`);
        core.info(`Manually change or add a link with an href to style.css`);
      }
      else {
        htmlSecondHalf = html.slice(headStartIdx + "<head>".length);
        html = html.slice(0, headStartIdx + "<head>".length);

        html += ' <link rel="stylesheet" href="style.css">';
        html = html + htmlSecondHalf;
        core.info(`CSS of ${hostname} linked successfully`);
      }

      const cssFilename = 'style.css';
      const cssPath = path.join(sourceDir, cssFilename);

      fs.writeFileSync(htmlPath, html);
      fs.writeFileSync(cssPath, css);
      finishedSrcPaths.push(sourceDir);
      core.info("Pushed source: " + pageTitle);
    }
    
    await browser.close();
    
    const time = new Date().toISOString();
    
    core.setOutput('source-paths', finishedSrcPaths);
    core.setOutput('time', time);
    core.setOutput('status', 'success');

    // core.setOutput('image-size', imageSize);
    // core.info(`Image size: ${imageSize}`);

    core.info(`Snapshot saved to: ${finishedSrcPaths}`);
    core.info(`Status: success`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.info("Where am I?" + `dirname: ${__dirname} and cwd: ${process.cwd()}`);
    core.setFailed(`Error: ${errorMessage}`);
    
    core.setOutput('status', 'failed');
    core.setOutput('time', new Date().toISOString());
    core.setOutput('snapshot-path', '');
    core.setOutput('image-size', '');
  }
}

run();
