# 🌐 Web Page Source Downloader

A GitHub Action that uses a headless browser to **load one or more web pages and save their rendered HTML source**, with optional CSS, directly to the GitHub Actions runner.

It is designed for workflows that need to automatically capture, inspect, archive, test, or process the source of web pages.

## 📑 Table of Contents

- [✨ Features](#-features)
- [🧠 How It Works](#-how-it-works)
  - [Example input](#example-input)
- [🚀 Usage](#-usage)
  - [1. Create `websites.txt`](#1-create-websitestxt)
  - [2. Add the action to your workflow](#2-add-the-action-to-your-workflow)
- [⚙️ Inputs](#%EF%B8%8F-inputs)
- [📄 HTML Files](#-html-files)
  - [`overwrite-html: true`](#overwrite-html-true)
  - [`overwrite-html: false`](#overwrite-html-false)
- [🎨 CSS Files](#-css-files)
  - [`overwrite-css: true`](#overwrite-css-true)
  - [`overwrite-css: false`](#overwrite-css-false)
  - [`save-css` takes priority](#save-css-takes-priority)
- [🔗 HTML & CSS File Relationships](#-html--css-file-relationships)
  - [📊 Quick Reference](#-quick-reference)
  - [🔄 Both overwrite options enabled](#-both-overwrite-options-enabled)
  - [📄 Overwrite HTML, timestamp CSS](#-overwrite-html-timestamp-css)
  - [📚 Timestamp HTML, overwrite CSS](#-timestamp-html-overwrite-css)
  - [🕐 Timestamp both HTML and CSS](#-timestamp-both-html-and-css)
- [🧭 Default Index](#-default-index)
- [🛠️ Custom Index](#%EF%B8%8F-custom-index)
  - [`index.html` is required](#-indexhtml-is-required)
- [⚠️ `default-index` and `custom-index`](#️-default-index-and-custom-index)
  - [Built-in index](#built-in-index)
  - [Custom index](#custom-index)
  - [No index](#no-index)
- [⭐ Example Configurations](#-example-configurations)
  - [🔄 Keep only the latest capture](#-keep-only-the-latest-capture)
  - [📚 Keep a history of captures](#-keep-a-history-of-captures)
  - [🎨 Use a custom viewer](#-use-a-custom-viewer)
- [🔁 Error Handling & Retries](#-error-handling--retries)
- [📤 Outputs](#-outputs)
- [📦 Saving Results as an Artifact](#-saving-results-as-an-artifact)
- [🧪 Use Cases](#-use-cases)
- [⚠️ Limitations](#️-limitations)
- [🙏 Credits](#-credits)
- [📄 License](#-license)

## ✨ Features

* 🌐 Download source from multiple URLs in a single workflow
* 🚀 Uses a headless browser to load pages before capturing their HTML
* 📄 Saves the rendered HTML source
* 🎨 Optionally downloads page CSS
* 🕐 Supports reusable or timestamped HTML snapshots
* 🕐 Supports reusable or timestamped CSS snapshots
* 🔁 Automatically retries failed pages
* ⏭️ Optionally skips pages that fail
* 📁 Organizes downloaded pages by hostname
* 🧭 Supports a built-in or custom `index.html`
* 📦 Works naturally with GitHub Actions artifacts
* ⚡ Runs directly on the GitHub Actions runner

---

# 🧠 How It Works

The action reads URLs from a `websites.txt` file in the workflow's working directory.

Each URL is processed individually:

1. The action launches a headless browser.
2. The target page is opened.
3. The page is allowed to load and stabilize.
4. The rendered HTML is captured.
5. CSS stylesheets can optionally be collected.
6. The HTML and CSS are saved under the `sites/` directory.
7. An optional `index.html` can be copied into the site's directory.
8. Failed pages can be retried automatically.

### Example input

```text
https://example.com
https://another-site.org/page
https://www.bilibili.com/video/BV1GJ411x7h7
```

The resulting structure looks similar to:

```text
sites/
├── example.com/
│   ├── example.com.html
│   └── style.css
│
├── another-site.org/
│   ├── another-site.org.html
│   └── style.css
│
└── www.bilibili.com/
    ├── www.bilibili.com.html
    └── style.css
```

The **hostname is used for both the site directory and the HTML filename**.

For example:

```text
https://example.com/some/page
```

is stored under:

```text
sites/example.com/
```

and the HTML file is:

```text
sites/example.com/example.com.html
```

The URL path does not affect the directory name.

---

# 🚀 Usage

## 1. Create `websites.txt`

Add a file named:

```text
websites.txt
```

to the **root of your repository**.

Example:

```text
https://example.com
https://another-site.org/page
https://www.bilibili.com/video/BV1GJ411x7h7
```

Use **one URL per line**.

### URL rules

* Put one URL on each line.
* Each URL is processed independently.
* The hostname determines the output directory.
* The hostname also determines the base HTML filename.

For example:

```text
https://example.com/
https://example.org/some/page
https://www.example.net/articles/test
```

produces:

```text
sites/
├── example.com/
├── example.org/
└── www.example.net/
```

---

# 2. Add the action to your workflow

Create a workflow such as:

```yaml
name: Download Web Pages

on:
  workflow_dispatch:

jobs:
  download:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Download web page source
        uses: siddhartasr10/action-webpage-source@main

      - name: Upload downloaded pages
        uses: actions/upload-artifact@v4
        with:
          name: web-page-source
          path: sites/
```

After the workflow finishes, the downloaded pages will be available in the `sites/` directory.

---

# ⚙️ Inputs

| Input            | Required | Default | Description                                                                                             |
| :--------------- | :------: | :-----: | :------------------------------------------------------------------------------------------------------ |
| `default-index`  |    Yes   | `false` | Copies the action's built-in `index.html` helper into each site folder.                                 |
| `custom-index`   |    Yes   | `false` | Copies an `index.html` from your repository root into each site folder.                                 |
| `save-css`       |    Yes   |  `true` | Downloads the page's loaded CSS and saves it alongside the HTML.                                        |
| `overwrite-css`  |    Yes   |  `true` | Controls whether CSS uses `style.css` or timestamped CSS filenames. Ignored when `save-css` is `false`. |
| `overwrite-html` |    Yes   | `false` | Controls whether HTML uses `<hostname>.html` or timestamped HTML filenames.                             |
| `skip-on-throw`  |    Yes   | `false` | Skips a page when an error occurs instead of retrying it.                                               |
| `max-throws`     |    Yes   |   `3`   | Maximum number of failed attempts allowed before the action gives up.                                   |

> **Important:** `default-index` and `custom-index` cannot both be `true`.

---

# 📄 HTML Files

The `overwrite-html` input controls whether the action keeps one HTML file per hostname or creates a new timestamped file for each capture.

## `overwrite-html: true`

The HTML file uses the hostname:

```text
<hostname>.html
```

For example:

```text
https://example.com/some/page
```

produces:

```text
sites/
└── example.com/
    └── example.com.html
```

Running the action again for the same hostname overwrites `example.com.html`.

This is useful when you only want to keep the **latest captured version** of each page.

## `overwrite-html: false`

A timestamp is added to the hostname:

```text
<hostname>-<timestamp>.html
```

For example:

```text
sites/
└── example.com/
    ├── example.com-2026-09-24T12-30-45-123Z.html
    └── example.com-2026-09-24T13-15-22-456Z.html
```

This is useful when you want to maintain a **history of HTML snapshots** instead of replacing the previous capture.

# 🎨 CSS Files

CSS downloading is controlled by:

```yaml
save-css: true
```

When enabled, the action collects the page's loaded stylesheets and saves the resulting CSS in the site's directory.

## `overwrite-css: true`

The CSS file is always named:

```text
style.css
```

Example:

```text
sites/
└── example.com/
    ├── example.com.html
    └── style.css
```

Running the action again replaces the existing `style.css` with the latest captured CSS.

## `overwrite-css: false`

A timestamp is added to the CSS filename:

```text
style-<timestamp>.css
```

Example:

```text
sites/
└── example.com/
    ├── style-2026-09-24T12-30-45-123Z.css
    └── style-2026-09-24T13-15-22-456Z.css
```

This allows multiple CSS snapshots to be kept.

### `save-css` takes priority

If:

```yaml
save-css: false
```

then `overwrite-css` has no effect.

No CSS file is downloaded.

# 🔗 HTML & CSS File Relationships

When CSS downloading is enabled, the action automatically makes the captured HTML reference the CSS file generated for that capture.

The exact relationship depends on `overwrite-html` and `overwrite-css`.

### 📊 Quick Reference

| `overwrite-html` | `overwrite-css` | HTML files  | CSS files       | HTML → CSS         |
| :--------------: | :-------------: | :---------- | :-------------- | :----------------- |
|      `true`      |      `true`     | One         | One `style.css` | `style.css`        |
|      `true`      |     `false`     | One         | Timestamped     | Latest CSS         |
|      `false`     |      `true`     | Timestamped | One `style.css` | `style.css`        |
|      `false`     |     `false`     | Timestamped | Timestamped     | Matching timestamp |

> **Note:** This relationship only applies when `save-css` is enabled. When `save-css: false`, no CSS file is generated and the CSS-saving options are ignored.

## 🔄 Both overwrite options enabled

```yaml
with:
  overwrite-html: true
  overwrite-css: true
```

Only one HTML file and one CSS file are kept:

```text
sites/
└── example.com/
    ├── example.com.html
    └── style.css
```

The HTML points to:

```html
<link rel="stylesheet" href="style.css">
```

Each new run replaces both files.

---

## 📄 Overwrite HTML, timestamp CSS

```yaml
with:
  overwrite-html: true
  overwrite-css: false
```

The HTML filename stays the same, while each CSS capture gets a timestamp:

```text
sites/
└── example.com/
    ├── example.com.html
    ├── style-2026-09-24T12-00-00-000Z.css
    ├── style-2026-09-24T13-00-00-000Z.css
    └── style-2026-09-24T14-00-00-000Z.css
```

The single HTML file is updated to reference the **latest CSS file**:

```html
<link rel="stylesheet" href="style-2026-09-24T14-00-00-000Z.css">
```

Older CSS files remain available, but the current HTML always points to the newest CSS capture.

---

## 📚 Timestamp HTML, overwrite CSS

```yaml
with:
  overwrite-html: false
  overwrite-css: true
```

Each HTML capture gets its own timestamp, while there is only one CSS file:

```text
sites/
└── example.com/
    ├── example.com-2026-09-24T12-00-00-000Z.html
    ├── example.com-2026-09-24T13-00-00-000Z.html
    ├── example.com-2026-09-24T14-00-00-000Z.html
    └── style.css
```

**All generated HTML files point to the same `style.css`.**

```html
<link rel="stylesheet" href="style.css">
```

When `style.css` is replaced by a newer capture, older HTML snapshots also reference the **current** CSS file rather than preserving the CSS that existed when that HTML was captured.

---

## 🕐 Timestamp both HTML and CSS

```yaml
with:
  overwrite-html: false
  overwrite-css: false
```

Both files receive timestamps:

```text
sites/
└── example.com/
    ├── example.com-2026-09-24T12-00-00-000Z.html
    ├── style-2026-09-24T12-00-00-000Z.css
    ├── example.com-2026-09-24T13-00-00-000Z.html
    └── style-2026-09-24T13-00-00-000Z.css
```

Each HTML file points to the CSS captured for the same run:

```html
<link rel="stylesheet" href="style-2026-09-24T12-00-00-000Z.css">
```

and:

```html
<link rel="stylesheet" href="style-2026-09-24T13-00-00-000Z.css">
```

This allows HTML and CSS snapshots to remain associated with each other.

# 🧭 Default Index

The `default-index` input allows the action to copy its built-in `index.html` helper into every generated site directory.

Enable it with:

```yaml
with:
  default-index: true
```

Example:

```text
sites/
└── example.com/
    ├── example.com.html
    ├── style.css
    └── index.html
```

You **do not need to create an `index.html` in your repository** when using `default-index`.

The action uses its own built-in helper.

---

# 🛠️ Custom Index

The `custom-index` input allows you to provide your **own** `index.html`.

Enable it with:

```yaml
with:
  custom-index: true
```

When `custom-index` is enabled, the action expects an:

```text
index.html
```

file in the **root of your repository/workspace**.

Your repository could look like:

```text
.
├── index.html
├── websites.txt
├── README.md
└── .github/
    └── workflows/
        └── download.yml
```

The action copies that `index.html` into every generated site directory.

For example:

```text
sites/
├── example.com/
│   ├── example.com.html
│   ├── style.css
│   └── index.html
│
└── another-site.org/
    ├── another-site.org.html
    ├── style.css
    └── index.html
```

Each generated site's `index.html` is a copy of the `index.html` from your repository root.

### ❗ `index.html` is required

If you set:

```yaml
custom-index: true
```

but there is no:

```text
index.html
```

in the repository root, the action will fail.

The action checks for the file before copying it.

---

# ⚠️ `default-index` and `custom-index`

These two options are mutually exclusive.

Do **not** use:

```yaml
with:
  default-index: true
  custom-index: true
```

The action will throw an error if both are enabled.

### Built-in index

```yaml
with:
  default-index: true
  custom-index: false
```

### Custom index

```yaml
with:
  default-index: false
  custom-index: true
```

### No index

```yaml
with:
  default-index: false
  custom-index: false
```

When both are `false`, the action does not add an `index.html`.

---

# ⭐ Example Configurations

## 🔄 Keep only the latest capture

If you want one HTML and one CSS file per hostname:

```yaml
- name: Download web pages
  uses: siddhartasr10/action-webpage-source@main
  with:
    save-css: true
    overwrite-html: true
    overwrite-css: true
    default-index: false
    custom-index: false
```

Output:

```text
sites/
└── example.com/
    ├── example.com.html
    └── style.css
```

---

## 📚 Keep a history of captures

If you want every capture to receive a timestamp:

```yaml
- name: Download web pages
  uses: siddhartasr10/action-webpage-source@main
  with:
    save-css: true
    overwrite-html: false
    overwrite-css: false
    default-index: false
    custom-index: false
```

Output:

```text
sites/
└── example.com/
    ├── example.com-2026-09-24T12-00-00-000Z.html
    ├── style-2026-09-24T12-00-00-000Z.css
    ├── example.com-2026-09-24T13-00-00-000Z.html
    └── style-2026-09-24T13-00-00-000Z.css
```

---

## 🎨 Use a custom viewer

If you have your own `index.html` for browsing the captured pages:

```yaml
- name: Download web pages
  uses: siddhartasr10/action-webpage-source@main
  with:
    save-css: true
    overwrite-html: true
    overwrite-css: true
    default-index: false
    custom-index: true
```

Repository:

```text
.
├── index.html
├── websites.txt
└── .github/
    └── workflows/
        └── download.yml
```

Generated output:

```text
sites/
├── example.com/
│   ├── example.com.html
│   ├── style.css
│   └── index.html
│
└── another-site.org/
    ├── another-site.org.html
    ├── style.css
    └── index.html
```

---

# 🔁 Error Handling & Retries

Pages can occasionally fail to load because of network errors, browser errors, unavailable resources, or other transient problems.

By default:

```yaml
with:
  skip-on-throw: false
  max-throws: 3
```

The action retries failed processing according to the configured limit.

If you prefer to skip problematic pages:

```yaml
with:
  skip-on-throw: true
```

This can be useful when processing a large list of URLs where one unavailable page should not prevent the rest from being processed.

---

# 📤 Outputs

The action provides the following outputs:

| Output         | Description                                                             |
| :------------- | :---------------------------------------------------------------------- |
| `source-paths` | Paths to the directories containing the downloaded source files.        |
| `status`       | Overall download status: `success` or `failed`.                         |
| `time`         | Time at which the download operation was performed, in ISO 8601 format. |

Example:

```yaml
- name: Download web pages
  id: download
  uses: siddhartasr10/action-webpage-source@main

- name: Show result
  run: |
    echo "Status: ${{ steps.download.outputs.status }}"
    echo "Time: ${{ steps.download.outputs.time }}"
    echo "Paths: ${{ steps.download.outputs.source-paths }}"
```

For example, `source-paths` contains the generated site directories:

```text
sites/example.com
sites/another-site.org
sites/www.example.net
```

---

# 📦 Saving Results as an Artifact

A common use case is to capture pages during a workflow and make the results available after the job completes.

```yaml
- name: Download web pages
  uses: siddhartasr10/action-webpage-source@main
  with:
    save-css: true
    overwrite-html: true
    overwrite-css: true

- name: Upload pages
  uses: actions/upload-artifact@v4
  with:
    name: downloaded-web-pages
    path: sites/
```

The resulting artifact contains the files generated by the action.

---

# 🧪 Use Cases

This action can be useful for:

* 📥 Capturing web page source automatically
* 🔍 Inspecting HTML and CSS in CI
* 🧪 Testing or analyzing live web pages
* 📦 Creating build artifacts from web pages
* 🤖 Feeding captured HTML into other automation steps
* 🗂️ Maintaining periodic copies of pages used by a workflow
* 🕐 Keeping timestamped snapshots for comparison
* 🎨 Creating custom viewers with `custom-index`
* 🔧 Running custom processing against captured HTML/CSS

---

# ⚠️ Limitations

This action loads pages in a browser before capturing their source. It is therefore different from a simple HTTP download.

Pages that depend heavily on JavaScript, authentication, anti-bot systems, geolocation, cookies, or other browser state may behave differently depending on the environment in which the GitHub Actions runner executes them.

The action does not attempt to reproduce an entire website. It captures the rendered page source and the supported CSS requested by the action.

The captured CSS is combined into the generated stylesheet rather than preserving the original website's complete asset structure.

The action uses the URL hostname as the site directory and HTML filename. For example:

```text
https://www.example.com/some/page
```

is stored under:

```text
sites/www.example.com/
```

with an HTML filename based on:

```text
www.example.com.html
```

or:

```text
www.example.com-<timestamp>.html
```

depending on `overwrite-html`.

Always make sure you have permission to access, copy, and process the pages you target.

---

# 🙏 Credits

This project is based on the original [Web Page Snapshot Action](https://github.com/SimpERROR/web-page-snapshot-action) by **SimpERROR**.

The original project was designed primarily around taking screenshots of web pages. This project reuses its structure and repurposes it for downloading web page source instead.

The browser implementation uses [`rebrowser-puppeteer`](https://github.com/rebrowser/rebrowser-puppeteer).

---

# 📄 License

The same as the original project:

```text
MIT License

Copyright (c) 2026 SimpERROR_

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
