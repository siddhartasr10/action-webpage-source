import * as core from '@actions/core';
import * as puppeteer from 'rebrowser-puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import * as net from 'net' 


const MAXTHROWS = 3;
let currentThrows = 0;

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
      .split("\n")
      .reverse(); // So we can iterate the list backwards but we can process the elements in their natural order

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

    if (core.getBooleanInput("save-css")) {
      page.on('response', async (response) => {
        if (response.request().resourceType() !== 'stylesheet') return;
        css += await response.text();
      });
    }

    const Rootdir = path.join(process.cwd(), 'sites');
    if (!fs.existsSync(Rootdir)) fs.mkdirSync(Rootdir, { recursive: true });

    for (let i = websites.length-1; i >= 0; i--) {
      css = "";

      await page.goto(websites[i], { waitUntil: 'domcontentloaded' });
      core.info(`Waiting for page: ${websites[i]} to stabilize...`);
      await waitForPageStable(page);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const pageTitle = await page.title();

      const hostname = new URL(websites[i]).hostname;

      const sourceDir = path.join(Rootdir, hostname);
      if (!fs.existsSync(sourceDir)) fs.mkdirSync(sourceDir, { recursive: true });

      // const filename = `snapshot-${timestamp}.png`;
      const htmlFilename = `${pageTitle}-${timestamp}.html`;
      const htmlPath = path.join(sourceDir, htmlFilename); // this was snapshotPath 
      let html = await page.content();
      
      // We search for the head tag and kinda do a split but with slice, as split removes the splitted element.
      // We add manually a stylesheet that links to our recovered CSS.
      const headStartIdx = (core.getBooleanInput("save-css")) ? html.match("<head>")?.index : null;
      let htmlSecondHalf = "";
      if (core.getBooleanInput("save-css")) {

        if (!headStartIdx) {
            core.info(`Head tag of ${hostname} cannot be found. It's CSS won't be loaded.`);
            core.info(`Manually change or add a link with an href to style.css`);
        }
        else {
            htmlSecondHalf = html.slice(headStartIdx! + "<head>".length);
            html = html.slice(0, headStartIdx! + "<head>".length);

            html += ' <link rel="stylesheet" href="style.css">';
            html = html + htmlSecondHalf;
            core.info(`CSS of ${hostname} linked successfully`);
        }
      }

      fs.writeFileSync(htmlPath, html);

      const cssFilename = 'style.css';
      const cssPath = path.join(sourceDir, cssFilename);

      if (core.getBooleanInput("save-css")) fs.writeFileSync(cssPath, css);

      finishedSrcPaths.push(sourceDir);
      core.info("Pushed source: " + pageTitle);

      // We copy for each source code the index.html so it can be correctly seen in the github page.
      if (!core.getBooleanInput("include-index")) continue;

      const idxSrcPath = path.join(__dirname, "index.html");
      const idxDestPath = path.join(sourceDir, "index.html");
      fs.copyFileSync(idxSrcPath, idxDestPath);
      
      // We remove the element off the list, so if the app crashes and we retry we don't repeat.
      websites.pop();
    }
    
    await browser.close();
    
    const time = new Date().toISOString();
    
    core.setOutput('source-paths', finishedSrcPaths);
    core.setOutput('time', time);
    core.setOutput('status', 'success');

    core.info(`Snapshot saved to: ${finishedSrcPaths}`);
    core.info(`Status: success`);
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.info("Where am I?" + `dirname: ${__dirname} and cwd: ${process.cwd()}`);
    core.info("Que tal se ve el mensaje del error de dns spliteao?" + (error as Error).message.split(" "));
    if (error instanceof Error && error.message.split(" ")[0] == "net::ERR_NAME_NOT_RESOLVED") core.info("Error de dns aAH");
    // core.info(`Error direct print: ${error},  error name or all propertynames ${(error instanceof Error) ? error.name : Object.getOwnPropertyNames(error)}`);
    // core.info(`Error Property names ${Object.getOwnPropertyNames(error)}, Los property decriptors illo ${Object.getOwnPropertyDescriptors(error)} del cual, el primero de la lista es: ${Object.getOwnPropertyDescriptors(error)[0]}`);
    // core.info(`Las propiedades dabidas son stack: ${(error as Error).stack}, name: ${(error as Error).name} y message: ${(error as Error).message}`);

    core.setFailed(`Error: ${errorMessage}`);
    
    core.setOutput('status', 'failed');
    core.setOutput('time', new Date().toISOString());
    core.setOutput('snapshot-path', '');
    core.setOutput('image-size', '');
    
  }
}

run();
