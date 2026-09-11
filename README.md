# 🌐 Simple Web Page Source Code Downloader

A lightweight GitHub Action that downloads the **source code of a web page**, including its HTML and CSS resources, and saves them on the GitHub Actions runner.

This project is based on the [Web Page Snapshot Action](https://github.com/SimpERROR/web-page-snapshot-action) by **SimpERROR**. The original project was designed to take screenshots of web pages; this fork repurposes its structure to download web page source files instead.

## 🚀 How it works

The action receives a URL, downloads the page source, and saves the resulting files on the runner.

Currently, the action is designed to download:

* 📄 HTML source code.
* 🎨 CSS stylesheets referenced by the page.

It can be useful for:

* 📥 Automatically downloading web page source code.
* 🔍 Inspecting or processing HTML and CSS in CI/CD workflows.
* 🧪 Testing the source of a web page automatically.
* 📦 Saving web page source as build artifacts.
* 🤖 Running automated scraping or analysis workflows.

## ⚙️ Inputs

| Parameter | Required | Default                                       | Description                                                    |
| :-------- | :------: | :-------------------------------------------- | :------------------------------------------------------------- |
| `website` |  **Yes** | `https://www.bilibili.com/video/BV1GJ411x7h7` | The URL of the website whose source code should be downloaded. |

## 📤 Outputs

| Parameter   | Description                                                  |
| :---------- | :----------------------------------------------------------- |
| `html-path` | The path to the downloaded HTML file on the runner.          |
| `status`    | The status of the download operation (`success` / `failed`). |
| `time`      | The time when the download was performed.                    |

> More outputs may be added as support for additional resources is implemented.

## 🛠️ Example

<!-- Example workflow will be added later. -->

## 📦 Downloaded resources

The action downloads the HTML source of the requested page and its referenced CSS stylesheets.

For example, a page containing:

```html
<link rel="stylesheet" href="/css/style.css">
```

will have both the HTML document and the referenced stylesheet downloaded.

CSS resources referenced through external URLs may also be downloaded when they are accessible to the action.

## 🔧 Technical details

The action runs using **Node.js 20** and its compiled entry point is located at:

```text
dist/index.js
```

The action is defined as:

```yaml
runs:
  using: 'node20'
  main: 'dist/index.js'
```

## ⚠️ Notes

The action downloads the resources returned by the target website. It does not necessarily represent the final DOM or styles after JavaScript has modified the page in a browser.

Websites may block automated requests, require authentication, or return different content depending on headers, cookies, location, or other request properties.

Please make sure you have permission to download and process the content of the websites you target.

## 📄 License

MIT License

### Credits

Originally based on [SimpERROR/web-page-snapshot-action](https://github.com/SimpERROR/web-page-snapshot-action).

The original project was created by **SimpERROR** and provided the initial GitHub Action structure used as the basis for this project.
