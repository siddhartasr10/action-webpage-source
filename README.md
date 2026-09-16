# 🌐 Simple Web Page Source Code Downloader

A lightweight GitHub Action that downloads the **source code of one or more web pages**, including their HTML (and optionally CSS), and saves them on the GitHub Actions runner.

This project is based on the [Web Page Snapshot Action](https://github.com/SimpERROR/web-page-snapshot-action) by **SimpERROR**. The original project was designed to take screenshots of web pages; this fork repurposes its structure to download web page source files instead.

## 🚀 How it works

The action reads a list of URLs from a `websites.txt` file (one URL per line) that must be present in the action’s working directory.  
For each URL it:

1. Opens the page with a headless browser
2. Waits for the page to stabilize
3. Saves the HTML source
4. Optionally collects and saves the CSS stylesheets
5. Optionally copies an `index.html` helper file into each site’s folder

Results are written under a `sites/` directory, organized by hostname.

It can be useful for:

* 📥 Automatically downloading web page source code for multiple sites
* 🔍 Inspecting or processing HTML and CSS in CI/CD workflows
* 🧪 Testing the source of web pages automatically
* 📦 Saving web page source as build artifacts
* 🤖 Running automated scraping or analysis workflows

## ⚙️ Inputs

| Parameter          | Required | Default | Description                                                                 |
| :----------------- | :------: | :------ | :-------------------------------------------------------------------------- |
| `include-index`    |    No    | `true`  | Whether to copy an `index.html` helper file into each downloaded site folder. |
| `save-css`         |    No    | `true`  | Whether to download and save the page’s CSS stylesheets as `style.css`.     |

> The old single-URL `website` input has been removed.  
> Provide the list of target URLs in a `websites.txt` file (one URL per line) instead.

## 📤 Outputs

| Parameter       | Description                                                                 |
| :-------------- | :-------------------------------------------------------------------------- |
| `source-paths`  | Array (or space-separated list) of paths to the folders containing the downloaded source for each site. |
| `status`        | The status of the download operation (`success` / `failed`).                |
| `time`          | The time when the download was performed (ISO 8601).                        |

## 📁 Expected input file

Place a file named `websites.txt` in the working directory of the action.  
It should contain one URL per line, for example:

```text
https://example.com
https://another-site.org/page
https://www.bilibili.com/video/BV1GJ411x7h7
