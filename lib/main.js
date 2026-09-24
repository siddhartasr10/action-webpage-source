"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const puppeteer = __importStar(require("rebrowser-puppeteer"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const NetError_1 = require("./types/NetError");
const MAXTHROWS = (!isNaN(Number(core.getInput("max-throws")))) ? Number(core.getInput("max-throws")) : 3;
let currentThrows = 0;
// TODO: Si quiero una variable en el yml que sea websites habra que añadir un if que ignore esta parte y solo la invierta.
// Needed to work as an action
const workspace = process.env.GITHUB_WORKSPACE ?? __dirname;
(process.env.GITHUB_WORKSPACE) ? core.info("Github Workspace found") : core.info("No Github Workspace found, using local websites.txt");
if (!fs.existsSync(path.join(workspace, "websites.txt")))
    throw new Error("websites.txt couldn't be found in the workspace " + workspace + "\n Dirname is: " + __dirname);
const websites = fs.readFileSync(path.join(workspace, "websites.txt")).toString()
    .trimEnd()
    .split("\n")
    .reverse(); // So we can iterate the list backwards but we can process the elements in their natural order
async function waitForPageStable(page, timeout = 30000) {
    const startTime = Date.now();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => { });
    await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => { });
    const checkStable = async () => {
        const isStable = await page.evaluate(() => {
            const navEntry = performance.getEntriesByType('navigation')[0];
            return (document.readyState === 'complete' &&
                navEntry?.loadEventEnd > 0);
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
                if (response.request().resourceType() !== 'stylesheet')
                    return;
                css += await response.text();
            });
        }
        const Rootdir = path.join(process.cwd(), 'sites');
        if (!fs.existsSync(Rootdir))
            fs.mkdirSync(Rootdir, { recursive: true });
        // reverse so i can remove them as I go in case i want to retry after a throw.
        for (let i = websites.length - 1; i >= 0; i--) {
            css = "";
            await page.goto(websites[i], { waitUntil: 'domcontentloaded' });
            core.info(`Waiting for page: ${websites[i]} to stabilize...`);
            await waitForPageStable(page);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const pageTitle = await page.title();
            const hostname = new URL(websites[i]).hostname;
            const sourceDir = path.join(Rootdir, hostname);
            if (!fs.existsSync(sourceDir))
                fs.mkdirSync(sourceDir, { recursive: true });
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
                    core.info(`<head> tag of ${hostname} cannot be found. It's CSS won't be loaded.`);
                    core.info(`Manually change or add a link with an href to style.css`);
                }
                else {
                    htmlSecondHalf = html.slice(headStartIdx + "<head>".length);
                    html = html.slice(0, headStartIdx + "<head>".length);
                    html += ' <link rel="stylesheet" href="style.css">';
                    html = html + htmlSecondHalf;
                    core.info(`CSS of ${hostname} linked successfully`);
                }
            }
            fs.writeFileSync(htmlPath, html);
            const cssFilename = 'style.css';
            const cssPath = path.join(sourceDir, cssFilename);
            if (core.getBooleanInput("save-css"))
                fs.writeFileSync(cssPath, css);
            finishedSrcPaths.push(sourceDir);
            core.info("Pushed source: " + pageTitle);
            // We remove the element off the list, so if the app crashes and we retry we don't repeat.
            // We do it before the continue part of the indexes.
            websites.pop();
            // If both false ignore index, if both true raise an error and if one true check which
            // and as GITHUB_WORKSPACE is the only part that can be undefined, if undefined you know its the gh workspace
            if (!core.getBooleanInput("default-index") && !core.getBooleanInput("custom-index"))
                continue;
            if (core.getBooleanInput("default-index") && core.getBooleanInput("custom-index"))
                throw new Error("default-index and custom-index cannot be both true, fix worflow");
            // We check which place we get the index if we get it at all
            const idxRoot = (core.getBooleanInput("default-index")) ? __dirname : process.env.GITHUB_WORKSPACE;
            if (!idxRoot)
                throw new Error("Github workspace not found for custom-index");
            // We copy for each source code the index.html so it can be correctly seen in the github page.
            const idxSrcPath = path.join(idxRoot, "index.html");
            const idxDestPath = path.join(sourceDir, "index.html");
            if (!fs.existsSync(idxSrcPath))
                throw new Error(`No index.html file found in: ${idxSrcPath}, if you're using custom-index add one to your project's root.`);
            fs.copyFileSync(idxSrcPath, idxDestPath);
        }
        await browser.close();
        const time = new Date().toISOString();
        core.setOutput('source-paths', finishedSrcPaths);
        core.setOutput('time', time);
        core.setOutput('status', 'success');
        core.info(`Snapshot saved to: ${finishedSrcPaths}`);
        core.info(`Status: success`);
        // Sometimes it doesn't close after failing retrying and then succeeding.
        return await new Promise(res => setTimeout(() => res(process.exit(0)), 3000));
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        core.info("Where am I?" + `dirname: ${__dirname} and cwd: ${process.cwd()}`);
        currentThrows++;
        // Err handling for Net errors.
        if (error instanceof Error && Object.values(NetError_1.NetError).some(errCode => error.message.includes(errCode))) {
            // TODO: Añadir más mensajes de error personalizados.
            if (error.message.includes(NetError_1.NetError.NAME_NOT_RESOLVED))
                core.info("DNS couldn't be resolved for website: " + websites.at(-1));
            else
                core.info(`Net Error: ${error.message.split(" ")[0]}. for website ${websites.at(-1)}`);
            core.info(`${MAXTHROWS - currentThrows} throws left, after that, program will finish uncompletely if necessary`);
            if (core.getBooleanInput('skip-on-throw')) {
                core.info("Skip on throw is enabled so skipping problematic page");
                websites.pop();
            }
            if (currentThrows < MAXTHROWS && websites.length)
                return run();
            (websites.length) ? core.setFailed("Max number of throws passed, failing action...") : core.info("No more websites left, last one was skipped");
            setTimeout(() => process.exit(1), 3000);
            return;
        }
        core.setFailed(`Error: ${errorMessage}`);
        core.setOutput('status', 'failed');
        core.setOutput('time', new Date().toISOString());
        core.setOutput('snapshot-path', '');
        core.setOutput('image-size', '');
    }
}
run();
//# sourceMappingURL=main.js.map