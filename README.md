# 🌐 Web Page Source Downloader

A GitHub Action that uses a headless browser to **load one or more web pages and save their rendered HTML source**, with optional CSS, directly to the GitHub Actions runner.

It is designed for workflows that need to automatically capture, inspect, archive, test, or process the source of web pages.

## ✨ Features

* 🌐 Download source from multiple URLs in a single workflow
* 🚀 Uses a headless browser to load pages before capturing their HTML
* 📄 Saves the rendered HTML source
* 🎨 Optionally downloads page CSS
* 🔁 Automatically retries failed pages
* ⏭️ Optionally skips pages that fail
* 📁 Organizes downloaded pages by hostname
* 📦 Works naturally with GitHub Actions artifacts
* ⚡ Runs directly on the GitHub Actions runner

## How it works

The action reads URLs from a `websites.txt` file in the workflow's working directory.

Each URL is processed individually:

1. The action launches a headless browser.
2. The target page is opened.
3. The page is allowed to load and stabilize.
4. The HTML source is captured.
5. CSS stylesheets are optionally downloaded.
6. The resulting files are saved under the `sites/` directory.
7. Failed pages can be retried automatically.

For example, given:

```text
https://example.com
https://another-site.org/page
https://www.bilibili.com/video/BV1GJ411x7h7
```

the action creates a structure similar to:

```text
sites/
├── example.com/
│   ├── index.html
│   └── style.css
│
├── another-site.org/
│   ├── index.html
│   └── style.css
│
└── www.bilibili.com/
    ├── index.html
    └── style.css
```

> The exact files produced depend on the action inputs and the content available on each page.

## 🚀 Usage

### 1. Create `websites.txt`

Add a `websites.txt` file to your repository:

```text
https://example.com
https://another-site.org/page
https://www.bilibili.com/video/BV1GJ411x7h7
```

Use one URL per line.

### 2. Add the action to your workflow

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

After the workflow finishes, the downloaded pages will be available in the `sites/` directory and can optionally be uploaded as a GitHub Actions artifact.

> Replace the `uses:` value with the repository/tag you want to consume after renaming the project.

## ⚙️ Inputs

| Input           | Required | Default | Description                                                            |
| :-------------- | :------: | :-----: | :--------------------------------------------------------------------- |
| `include-index` |    No    |  `true` | Copies an `index.html` helper into each downloaded site's folder.      |
| `save-css`      |    No    |  `true` | Downloads available page CSS and saves it as `style.css`.              |
| `skip-on-throw` |    No    | `false` | Skips a page when an error occurs instead of retrying it.              |
| `max-throws`    |    No    |   `3`   | Maximum number of failed attempts allowed for a page before giving up. |

### Example

```yaml
- name: Download web pages
  uses: siddhartasr10/action-webpage-source@main
  with:
    include-index: true
    save-css: true
    skip-on-throw: false
    max-throws: 3
```

## 📤 Outputs

| Output         | Description                                                             |
| :------------- | :---------------------------------------------------------------------- |
| `source-paths` | Paths to the folders containing the downloaded source files.            |
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

## 📁 Input file

The action expects a file named:

```text
websites.txt
```

in the workflow's working directory.

Example:

```text
https://example.com
https://example.org
https://example.net/some-page
```

### URL rules

* Put one URL on each line.
* Each URL is processed independently.

## 🎨 CSS

CSS downloading can be controlled with the `save-css` input.

Enabled:

```yaml
with:
  save-css: true
```

When CSS is available, the action saves it as:

```text
style.css
```

inside the corresponding site's directory.

Disable CSS downloading with:

```yaml
with:
  save-css: false
```

## 🔁 Error handling and retries

Pages can occasionally fail to load because of network errors, browser errors, unavailable resources, or other transient problems.

By default, the action allows failed attempts to be retried:

```yaml
with:
  skip-on-throw: false
  max-throws: 3
```

If you prefer to skip a page when it fails:

```yaml
with:
  skip-on-throw: true
```

This can be useful when processing a large list of URLs where one unavailable page should not prevent the rest from being processed.

## 📦 Saving the results as an artifact

A common use case is to capture pages during a workflow and make the results available after the job completes.

```yaml
- name: Download web pages
  uses: siddhartasr10/action-webpage-source@main

- name: Upload pages
  uses: actions/upload-artifact@v4
  with:
    name: downloaded-web-pages
    path: sites/
```

The resulting artifact contains the files generated by the action.

## 🧪 Use cases

This action can be useful for:

* 📥 Capturing web page source automatically
* 🔍 Inspecting HTML and CSS in CI
* 🧪 Testing or analyzing live web pages
* 📦 Creating build artifacts from web pages
* 🤖 Feeding captured HTML into other automation steps
* 🗂️ Maintaining periodic copies of pages used by a workflow
* 🔧 Running custom processing against downloaded page source

## ⚠️ Limitations

This action loads pages in a browser before capturing their source. It is therefore different from a simple HTTP download.

Pages that depend heavily on JavaScript, authentication, anti-bot systems, geolocation, cookies, or other browser state may behave differently depending on the environment in which the GitHub Actions runner executes them.

The action also does not attempt to reproduce an entire website. It captures the page source and the supported CSS requested by the action.

Always make sure you have permission to access, copy, and process the pages you target.

## 🙏 Credits

This project is based on the original
[Web Page Snapshot Action](https://github.com/SimpERROR/web-page-snapshot-action)
by **SimpERROR**.

The original project was designed primarily around taking screenshots of web pages. This project reuses its structure and repurposes it for downloading web page source instead.

## 📄 License

The same as the original project:

```
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
