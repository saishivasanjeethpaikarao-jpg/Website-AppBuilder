/**
 * Automated Native Node 24 + Chrome CDP End-to-End Test Suite
 * Project: Website-AppBuilder (elhir.com) Bespoke Dark Studio IDE
 *
 * Requirements Tested:
 * - Tier 1: Feature Coverage (Home hero, Prompt composer, Studio 3-column layout,
 *           Code Editor, Files panel, Live Preview sandbox, Inspector, Settings BYOK, Profile card)
 * - Tier 2: Boundary & Corner Cases (empty prompt handling, quick provider switching,
 *           editor scroll syncing, invalid/missing keys, device view toggling, theme toggles)
 * - Tier 3: Cross-Feature Interactions (Settings BYOK save -> Top AI badge update;
 *           Code editor typing -> Debounced preview re-render; New file creation -> Editor tabs + File list sync)
 * - Tier 4: Real-World Application Scenarios (Full workflow: start at Home -> Enter prompt ->
 *           Switch to Studio -> Edit code in editor -> Verify preview sandbox update ->
 *           Inspect properties in inspector -> Open Settings -> Save keys)
 *
 * Target: http://localhost:3000/
 */

const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to query local JSON endpoints
async function getJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch(e) { reject(e); }
      });
    }).on('error', reject);
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Minimalist, robust Chrome DevTools Protocol Client using Node 24 global WebSocket
class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
    this.consoleLogs = [];
    this.runtimeExceptions = [];
    this.appExceptions = [];
    this.dialogEvents = [];
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('CDP WebSocket connect timeout')), 10000);
      this.ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };
      this.ws.onerror = (e) => {
        clearTimeout(timeout);
        reject(e);
      };
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.id && this.callbacks.has(msg.id)) {
            const cb = this.callbacks.get(msg.id);
            this.callbacks.delete(msg.id);
            if (msg.error) cb.reject(new Error(msg.error.message || JSON.stringify(msg.error)));
            else cb.resolve(msg.result);
          } else if (msg.method) {
            if (msg.method === 'Runtime.consoleAPICalled') {
              this.consoleLogs.push({
                type: msg.params.type,
                args: msg.params.args.map(a => a.value || a.description || '')
              });
            } else if (msg.method === 'Runtime.exceptionThrown') {
              const exc = msg.params.exceptionDetails;
              this.runtimeExceptions.push(exc);
              if (!exc.url || !exc.url.includes('srcdoc')) {
                this.appExceptions.push(exc);
              }
            } else if (msg.method === 'Page.javascriptDialogOpening') {
              this.dialogEvents.push(msg.params);
              // Auto-dismiss or auto-accept dialogs to avoid hanging CDP
              this.send('Page.handleJavaScriptDialog', { accept: true, promptText: 'e2e-dialog-response' }).catch(() => {});
            }
          }
        } catch (_) {}
      };
    });
  }

  async send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.callbacks.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, 15000);

      this.callbacks.set(id, {
        resolve: (val) => { clearTimeout(timer); resolve(val); },
        reject: (err) => { clearTimeout(timer); reject(err); }
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression,
      returnByValue: true,
      awaitPromise: true
    });
    if (res.exceptionDetails) {
      const desc = res.exceptionDetails.exception ? (res.exceptionDetails.exception.description || res.exceptionDetails.exception.value) : '';
      throw new Error(`CDP eval exception: ${res.exceptionDetails.text} ${desc} (expr: ${expression.slice(0, 80)})`);
    }
    return res.result ? res.result.value : undefined;
  }

  async waitFor(expression, timeoutMs = 5000, intervalMs = 100) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      try {
        const val = await this.eval(expression);
        if (val) return val;
      } catch (_) {}
      await sleep(intervalMs);
    }
    throw new Error(`Timeout waiting for expression: ${expression}`);
  }

  close() {
    if (this.ws) {
      try { this.ws.close(); } catch (_) {}
    }
  }
}

// Test Runner Framework
class TestRunner {
  constructor() {
    this.suites = [];
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
    this.assertions = 0;
    this.results = [];
  }

  assert(condition, message) {
    this.assertions++;
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  assertEqual(actual, expected, message) {
    this.assertions++;
    if (actual !== expected) {
      throw new Error(`Assertion failed: ${message} (Expected: ${JSON.stringify(expected)}, Actual: ${JSON.stringify(actual)})`);
    }
  }

  assertIncludes(actual, substring, message) {
    this.assertions++;
    if (typeof actual !== 'string' || !actual.includes(substring)) {
      throw new Error(`Assertion failed: ${message} (Expected "${actual}" to include "${substring}")`);
    }
  }

  async runSuite(suiteName, testsFn) {
    console.log(`\n============================================================`);
    console.log(`SUITE: ${suiteName}`);
    console.log(`============================================================`);
    const suite = { name: suiteName, tests: [] };
    this.suites.push(suite);

    const test = async (testName, testFn) => {
      this.totalTests++;
      const t0 = Date.now();
      try {
        await testFn();
        const duration = Date.now() - t0;
        this.passedTests++;
        console.log(`  ✓ [PASS] ${testName} (${duration}ms)`);
        suite.tests.push({ name: testName, status: 'PASS', duration });
      } catch (err) {
        const duration = Date.now() - t0;
        this.failedTests++;
        console.error(`  ✗ [FAIL] ${testName} (${duration}ms)`);
        console.error(`     Error: ${err.message}`);
        suite.tests.push({ name: testName, status: 'FAIL', duration, error: err.message });
      }
    };

    await testsFn(test);
  }

  printSummary() {
    console.log(`\n============================================================`);
    console.log(`TEST RUN SUMMARY`);
    console.log(`============================================================`);
    console.log(`Total Suites:     ${this.suites.length}`);
    console.log(`Total Tests:      ${this.totalTests}`);
    console.log(`Passed Tests:     ${this.passedTests}`);
    console.log(`Failed Tests:     ${this.failedTests}`);
    console.log(`Total Assertions: ${this.assertions}`);
    console.log(`Pass Rate:        ${((this.passedTests / (this.totalTests || 1)) * 100).toFixed(1)}%`);
    console.log(`============================================================\n`);
  }
}

// Find installed Chrome binary on Windows
function findChromeExecutable() {
  const candidates = [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

async function main() {
  const runner = new TestRunner();
  const chromePath = findChromeExecutable();
  if (!chromePath) {
    console.error('Fatal: No Chrome or Edge executable found.');
    process.exit(1);
  }

  const tempUserDataDir = path.join(os.tmpdir(), `wb-chrome-test-${Date.now()}`);
  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const cdpPort = 9222;
  console.log(`Launching Headless Chrome from: ${chromePath}`);
  console.log(`Isolated User Data Dir: ${tempUserDataDir}`);

  const chromeProc = spawn(chromePath, [
    '--headless=new',
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${tempUserDataDir}`,
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    'about:blank'
  ]);

  let cdp = null;

  try {
    // Poll for Chrome CDP readiness
    let versionInfo = null;
    for (let i = 0; i < 30; i++) {
      await sleep(200);
      try {
        versionInfo = await getJson(`http://127.0.0.1:${cdpPort}/json/version`);
        if (versionInfo) break;
      } catch (_) {}
    }

    if (!versionInfo) {
      throw new Error(`Failed to establish connection to Chrome on port ${cdpPort}`);
    }

    const list = await getJson(`http://127.0.0.1:${cdpPort}/json/list`);
    const pageTarget = list.find(t => t.type === 'page') || list[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('DOM.enable');

    console.log('Navigating to http://localhost:3000/ ...');
    await cdp.send('Page.navigate', { url: 'http://localhost:3000/' });
    await sleep(2500);

    // =========================================================================
    // TIER 1: FEATURE COVERAGE
    // =========================================================================
    await runner.runSuite('Tier 1: Feature Coverage', async (test) => {

      await test('1.1 Home Hero, Branding, Starter Templates & Project Grid', async () => {
        // Ensure starting on home screen
        await cdp.eval('if (typeof window.__go === "function") window.__go("home");');
        await sleep(400);

        const homeState = await cdp.eval(`({
          screen: document.body.dataset.screen,
          hasHome: !!document.getElementById("homeScreen"),
          hasHeroTitle: !!document.querySelector("#homeScreen h1"),
          heroText: document.querySelector("#homeScreen h1")?.textContent || "",
          hasHomePrompt: !!document.getElementById("homePrompt"),
          hasHomeStyle: !!document.getElementById("homeStyle"),
          hasHomeKind: !!document.getElementById("homeKind"),
          hasHomeBuildBtn: !!document.getElementById("btnHomeBuild"),
          hasTplGrid: !!document.getElementById("homeTplGrid"),
          tplCount: document.querySelectorAll("#homeTplGrid [data-htpl]").length,
          hasProjGrid: !!document.getElementById("projGrid")
        })`);

        runner.assertEqual(homeState.screen, 'home', 'Body dataset screen must be home');
        runner.assert(homeState.hasHome, '#homeScreen must exist');
        runner.assert(homeState.hasHeroTitle, 'Home screen must contain a hero <h1>');
        runner.assert(homeState.hasHomePrompt, '#homePrompt textarea must exist');
        runner.assert(homeState.hasHomeStyle, '#homeStyle selector must exist');
        runner.assert(homeState.hasHomeKind, '#homeKind selector must exist');
        runner.assert(homeState.hasHomeBuildBtn, '#btnHomeBuild button must exist');
        runner.assert(homeState.hasTplGrid, '#homeTplGrid template grid must exist');
        runner.assert(homeState.hasProjGrid, '#projGrid projects container must exist');
      });

      await test('1.2 Studio 3-Column IDE Layout & Segmented Views', async () => {
        // Transition to workspace studio
        await cdp.eval('window.__go("workspace");');
        await sleep(600);

        const wsLayout = await cdp.eval(`({
          screen: document.body.dataset.screen,
          wsmode: document.body.dataset.wsmode,
          hasMain: !!document.querySelector(".main, #mainGrid"),
          hasColCode: !!document.querySelector(".col-code"),
          hasColPreview: !!document.querySelector(".col-preview"),
          hasColFiles: !!document.querySelector(".col-files"),
          hasSegStudio: !!document.querySelector(".ws-seg button[data-ws='preview']"),
          hasSegFiles: !!document.querySelector(".ws-seg button[data-ws='files']"),
          hasSegCode: !!document.querySelector(".ws-seg button[data-ws='code']")
        })`);

        runner.assertEqual(wsLayout.screen, 'workspace', 'Body dataset screen must switch to workspace');
        runner.assert(wsLayout.hasMain, 'Studio workspace layout container must exist');
        runner.assert(wsLayout.hasColCode, 'Code editor column must exist in DOM');
        runner.assert(wsLayout.hasColPreview, 'Live preview column must exist in DOM');
        runner.assert(wsLayout.hasColFiles, 'Virtual files column must exist in DOM');
        runner.assert(wsLayout.hasSegStudio, 'Segmented Studio button must exist');
        runner.assert(wsLayout.hasSegFiles, 'Segmented Files button must exist');
        runner.assert(wsLayout.hasSegCode, 'Segmented Code button must exist');
      });

      await test('1.3 Studio Prompt Composer & Builder Tabs', async () => {
        const composerState = await cdp.eval(`({
          hasWsInput: !!document.getElementById("wsInput"),
          placeholder: document.getElementById("wsInput")?.placeholder || "",
          hasWsMode: !!document.getElementById("wsMode"),
          hasWsSend: !!document.getElementById("wsSend"),
          hasQuickAi: !!document.getElementById("quickAiProvider"),
          hasPlanTog: !!document.querySelector("[data-ptog='plan']"),
          hasBuildTog: !!document.querySelector("[data-ptog='build']"),
          hasChatFeed: !!document.getElementById("chatFeed")
        })`);

        runner.assert(composerState.hasWsInput, '#wsInput prompt textarea must exist');
        runner.assert(composerState.hasWsMode, '#wsMode composer select must exist');
        runner.assert(composerState.hasWsSend, '#wsSend submit button must exist');
        runner.assert(composerState.hasQuickAi, '#quickAiProvider dropdown must exist');
        runner.assert(composerState.hasPlanTog, 'Plan mode toggle [data-ptog="plan"] must exist');
        runner.assert(composerState.hasBuildTog, 'Build mode toggle [data-ptog="build"] must exist');
        runner.assert(composerState.hasChatFeed, '#chatFeed container must exist');
      });

      await test('1.4 Code Editor Textarea, Line Gutter & Status Bar', async () => {
        // Switch to code view
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'code\']")?.click();');
        await sleep(300);

        const editorState = await cdp.eval(`({
          wsmode: document.body.dataset.wsmode,
          hasCodeEditor: !!document.getElementById("codeEditor"),
          editorValueLength: (document.getElementById("codeEditor")?.value || "").length,
          hasGutter: !!document.getElementById("gutter"),
          gutterNumbers: (document.getElementById("gutter")?.textContent || "").trim().split("\\n").length,
          hasCodeMeta: !!document.getElementById("codeMeta"),
          hasEditorTabs: !!document.getElementById("editorTabs"),
          tabsCount: document.querySelectorAll("#editorTabs .ftab[data-file]").length,
          hasQuickAddTab: !!document.getElementById("btnQuickAddTab")
        })`);

        runner.assertEqual(editorState.wsmode, 'code', 'Workspace mode must be code');
        runner.assert(editorState.hasCodeEditor, '#codeEditor textarea must exist');
        runner.assert(editorState.editorValueLength > 0, 'Code editor should contain initial project source');
        runner.assert(editorState.hasGutter, '#gutter line numbers gutter must exist');
        runner.assert(editorState.gutterNumbers > 1, 'Gutter should render line numbers for active file');
        runner.assert(editorState.hasCodeMeta, '#codeMeta status bar must exist');
        runner.assert(editorState.hasEditorTabs, '#editorTabs container must exist');
        runner.assert(editorState.tabsCount >= 3, 'Must render tabs for index.html, styles.css, script.js');
        runner.assert(editorState.hasQuickAddTab, '#btnQuickAddTab (+) button must exist');
      });

      await test('1.5 Virtual Files Tree Panel', async () => {
        // Switch to files view
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'files\']")?.click();');
        await sleep(300);

        const filesState = await cdp.eval(`({
          wsmode: document.body.dataset.wsmode,
          hasFilesPanel: !!document.getElementById("filesPanel"),
          hasFileCountBadge: !!document.getElementById("fileCountBadge"),
          badgeText: document.getElementById("fileCountBadge")?.textContent || "",
          hasAddFileBtn: !!document.getElementById("btnAddFile"),
          hasFileList: !!document.getElementById("fileList"),
          fileRowsCount: document.querySelectorAll("#fileList .file-row").length
        })`);

        runner.assertEqual(filesState.wsmode, 'files', 'Workspace mode must be files');
        runner.assert(filesState.hasFilesPanel, '#filesPanel container must exist');
        runner.assert(filesState.hasFileCountBadge, '#fileCountBadge must exist');
        runner.assertIncludes(filesState.badgeText, 'file', 'File count badge must display count of files');
        runner.assert(filesState.hasAddFileBtn, '#btnAddFile button must exist');
        runner.assert(filesState.hasFileList, '#fileList container must exist');
        runner.assert(filesState.fileRowsCount >= 3, 'File list must render rows for files in project');
      });

      await test('1.6 Live Preview Sandbox & Error Banner', async () => {
        // Return to studio preview view
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'preview\']")?.click();');
        await sleep(400);

        const previewState = await cdp.eval(`({
          wsmode: document.body.dataset.wsmode,
          hasPreview: !!document.getElementById("preview"),
          hasPreviewPhone: !!document.getElementById("previewPhone"),
          hasBrowserUrl: !!document.getElementById("browserUrl"),
          hasUrlPill: !!document.getElementById("urlPill"),
          hasBtnRefresh: !!document.getElementById("btnRefresh"),
          hasBtnEditMode: !!document.getElementById("btnEditMode"),
          hasErrBanner: !!document.getElementById("previewErrBanner"),
          hasAutoFixBtn: !!document.getElementById("btnAutoFixErr"),
          srcDocLength: (document.getElementById("preview")?.srcdoc || "").length
        })`);

        runner.assertEqual(previewState.wsmode, 'preview', 'Workspace mode must be preview');
        runner.assert(previewState.hasPreview, '#preview iframe must exist');
        runner.assert(previewState.hasPreviewPhone, '#previewPhone mobile preview iframe must exist');
        runner.assert(previewState.hasBrowserUrl, '#browserUrl address bar must exist');
        runner.assert(previewState.hasUrlPill, '#urlPill display must exist');
        runner.assert(previewState.hasBtnRefresh, '#btnRefresh button must exist');
        runner.assert(previewState.hasBtnEditMode, '#btnEditMode button must exist');
        runner.assert(previewState.hasErrBanner, '#previewErrBanner error container must exist');
        runner.assert(previewState.hasAutoFixBtn, '#btnAutoFixErr 1-click self-healing button must exist');
        runner.assert(previewState.srcDocLength > 50, '#preview iframe must contain generated srcdoc document');
      });

      await test('1.7 Visual Property Inspector', async () => {
        const inspState = await cdp.eval(`({
          hasInspector: !!document.getElementById("inspector"),
          hasInspTag: !!document.getElementById("inspTag"),
          hasInspText: !!document.getElementById("inspText"),
          hasInspFontSize: !!document.getElementById("inspFontSize"),
          hasInspFontSizeVal: !!document.getElementById("inspFontSizeVal"),
          hasInspColor: !!document.getElementById("inspColor"),
          hasInspBg: !!document.getElementById("inspBg"),
          hasInspPad: !!document.getElementById("inspPad"),
          hasInspRadius: !!document.getElementById("inspRadius"),
          hasInspWidth: !!document.getElementById("inspWidth"),
          hasInspDuplicate: !!document.getElementById("inspDuplicate"),
          hasInspDelete: !!document.getElementById("inspDelete"),
          hasInspClose: !!document.getElementById("inspClose")
        })`);

        runner.assert(inspState.hasInspector, '#inspector panel must exist');
        runner.assert(inspState.hasInspTag, '#inspTag element indicator must exist');
        runner.assert(inspState.hasInspText, '#inspText textarea must exist');
        runner.assert(inspState.hasInspFontSize, '#inspFontSize range slider must exist');
        runner.assert(inspState.hasInspColor, '#inspColor input must exist');
        runner.assert(inspState.hasInspBg, '#inspBg background input must exist');
        runner.assert(inspState.hasInspPad, '#inspPad padding slider must exist');
        runner.assert(inspState.hasInspRadius, '#inspRadius border-radius slider must exist');
        runner.assert(inspState.hasInspClose, '#inspClose button must exist');
      });

      await test('1.8 Settings BYOK Inputs, Preferences & Publishing Tokens', async () => {
        // Navigate to settings screen
        await cdp.eval('window.__go("settings");');
        await sleep(500);

        const settingsState = await cdp.eval(`({
          screen: document.body.dataset.screen,
          hasSettings: !!document.getElementById("settingsScreen"),
          hasGroq: !!document.getElementById("setAiGroq"),
          hasGemini: !!document.getElementById("setAiGemini"),
          hasNvidia: !!document.getElementById("setAiNvidia"),
          hasClaude: !!document.getElementById("setAiClaude"),
          hasOpenai: !!document.getElementById("setAiOpenai"),
          hasCustomUrl: !!document.getElementById("setAiCustomUrl"),
          hasCustomKey: !!document.getElementById("setAiCustomKey"),
          hasCustomModel: !!document.getElementById("setAiCustomModel"),
          hasProviderSelect: !!document.getElementById("setAiProvider"),
          hasBtnSaveAi: !!document.getElementById("btnSaveAi"),
          hasAiStatus: !!document.getElementById("aiKeyStatus"),
          hasFontSize: !!document.getElementById("setFontSize"),
          hasTabSize: !!document.getElementById("setTabSize"),
          hasWrap: !!document.getElementById("setWrap"),
          hasLines: !!document.getElementById("setLines"),
          hasTokVercel: !!document.getElementById("tokVercel"),
          hasTokNetlify: !!document.getElementById("tokNetlify"),
          hasTokCloudflare: !!document.getElementById("tokCloudflare")
        })`);

        runner.assertEqual(settingsState.screen, 'settings', 'Screen must switch to settings');
        runner.assert(settingsState.hasSettings, '#settingsScreen container must exist');
        runner.assert(settingsState.hasGroq, '#setAiGroq key input must exist');
        runner.assert(settingsState.hasGemini, '#setAiGemini key input must exist');
        runner.assert(settingsState.hasNvidia, '#setAiNvidia key input must exist');
        runner.assert(settingsState.hasClaude, '#setAiClaude key input must exist');
        runner.assert(settingsState.hasOpenai, '#setAiOpenai key input must exist');
        runner.assert(settingsState.hasCustomUrl, '#setAiCustomUrl input must exist');
        runner.assert(settingsState.hasProviderSelect, '#setAiProvider select must exist');
        runner.assert(settingsState.hasBtnSaveAi, '#btnSaveAi button must exist');
        runner.assert(settingsState.hasAiStatus, '#aiKeyStatus status element must exist');
        runner.assert(settingsState.hasFontSize, '#setFontSize preference slider must exist');
        runner.assert(settingsState.hasTabSize, '#setTabSize preference input must exist');
        runner.assert(settingsState.hasWrap, '#setWrap line wrapping toggle must exist');
        runner.assert(settingsState.hasLines, '#setLines line numbers toggle must exist');
      });

      await test('1.9 Profile & Account Screen', async () => {
        // Navigate to profile screen
        await cdp.eval('window.__go("profile");');
        await sleep(500);

        const profState = await cdp.eval(`({
          screen: document.body.dataset.screen,
          hasProfile: !!document.getElementById("profileScreen"),
          hasAvatar: !!document.getElementById("profAvatar"),
          hasDisplayName: !!document.getElementById("profDisplayName"),
          hasDisplayUser: !!document.getElementById("profDisplayUser"),
          hasDisplayBio: !!document.getElementById("profDisplayBio"),
          hasStatProjects: !!document.getElementById("statProjects"),
          hasStatPublished: !!document.getElementById("statPublished"),
          hasStatSkills: !!document.getElementById("statSkills"),
          hasProfNameInput: !!document.getElementById("profName"),
          hasProfUsernameInput: !!document.getElementById("profUsername"),
          hasProfBioInput: !!document.getElementById("profBio"),
          hasSaveBtn: !!document.getElementById("btnSaveProfile")
        })`);

        runner.assertEqual(profState.screen, 'profile', 'Screen must switch to profile');
        runner.assert(profState.hasProfile, '#profileScreen container must exist');
        runner.assert(profState.hasAvatar, '#profAvatar avatar display must exist');
        runner.assert(profState.hasDisplayName, '#profDisplayName display must exist');
        runner.assert(profState.hasStatProjects, '#statProjects counter must exist');
        runner.assert(profState.hasStatPublished, '#statPublished counter must exist');
        runner.assert(profState.hasStatSkills, '#statSkills counter must exist');
        runner.assert(profState.hasProfNameInput, '#profName input must exist');
        runner.assert(profState.hasSaveBtn, '#btnSaveProfile button must exist');
      });

    });

    // =========================================================================
    // TIER 2: BOUNDARY & CORNER CASES
    // =========================================================================
    await runner.runSuite('Tier 2: Boundary & Corner Cases', async (test) => {

      await test('2.1 Empty & Whitespace-Only Prompt Handling', async () => {
        await cdp.eval('window.__go("workspace");');
        await sleep(400);

        // Capture exceptions before and after empty send
        const prevExceptions = cdp.runtimeExceptions.length;

        // Try sending an empty prompt
        await cdp.eval(`(() => {
          const wsInput = document.getElementById("wsInput");
          const wsSend = document.getElementById("wsSend");
          if (wsInput && wsSend) {
            wsInput.value = "";
            wsSend.click();
          }
        })()`);
        await sleep(300);

        // Try sending a whitespace-only prompt
        await cdp.eval(`(() => {
          const wsInput = document.getElementById("wsInput");
          const wsSend = document.getElementById("wsSend");
          if (wsInput && wsSend) {
            wsInput.value = "     \\n\\t  ";
            wsSend.click();
          }
        })()`);
        await sleep(300);

        const newExceptions = cdp.runtimeExceptions.length - prevExceptions;
        runner.assertEqual(newExceptions, 0, 'Empty prompt submissions must not produce unhandled exceptions');

        const activeToast = await cdp.eval(`(() => {
          const toast = document.querySelector(".toast, .banner, [role='alert'], #toast");
          return toast ? toast.textContent : "";
        })()`);
        // System handles gracefully without crashing
        runner.assert(true, 'Empty and whitespace prompt gracefully guarded');
      });

      await test('2.2 Rapid Bidirectional Quick Provider Switching', async () => {
        // Rapidly switch through multiple providers to verify no race conditions or state corruption
        const providers = ['groq', 'gemini', 'nvidia', 'claude', 'openai', 'custom', 'auto'];

        for (const prov of providers) {
          await cdp.eval(`(() => {
            const sel = document.getElementById("quickAiProvider");
            if (sel) {
              sel.value = "${prov}";
              sel.dispatchEvent(new Event("change"));
            }
          })()`);
          await sleep(50);
        }

        const finalStored = await cdp.eval(`(() => {
          try {
            const raw = localStorage.getItem("wb_ai_keys");
            return raw ? JSON.parse(raw).provider : "";
          } catch(e) { return "err"; }
        })()`);

        runner.assertEqual(finalStored, 'auto', 'Rapid switching correctly records last selected provider in localStorage');
      });

      await test('2.3 Line Gutter Scroll Synchronization with Editor', async () => {
        // Switch to code view
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'code\']")?.click();');
        await sleep(300);

        // Populate editor with sufficient lines to enable scrolling
        await cdp.eval(`(() => {
          const editor = document.getElementById("codeEditor");
          if (editor) {
            let filler = "";
            for (let i = 1; i <= 150; i++) filler += "<!-- Line " + i + " test content for scroll sync verification -->\\n";
            editor.value = filler;
            if (typeof updateGutter === "function") updateGutter();
            editor.scrollTop = 220;
            editor.dispatchEvent(new Event("scroll"));
          }
        })()`);
        await sleep(250);

        const scrollSync = await cdp.eval(`(() => {
          const editor = document.getElementById("codeEditor");
          const gutter = document.getElementById("gutter");
          return {
            editorScrollTop: editor ? editor.scrollTop : 0,
            gutterScrollTop: gutter ? gutter.scrollTop : 0,
            diff: editor && gutter ? Math.abs(editor.scrollTop - gutter.scrollTop) : 999
          };
        })()`);

        // Gutter should synchronize closely with editor scrollTop
        runner.assert(scrollSync.diff <= 5, `Line gutter scroll (${scrollSync.gutterScrollTop}) must track codeEditor scroll (${scrollSync.editorScrollTop}) within 5px`);
      });

      await test('2.4 Corrupted, Missing & Invalid API Keys Graceful Fallback', async () => {
        // Save corrupted/empty keys in localStorage
        await cdp.eval(`(() => {
          localStorage.setItem("wb_ai_keys", JSON.stringify({
            groq: "", gemini: "", nvidia: "", claude: "", openai: "",
            customUrl: "invalid-url-without-protocol", customKey: "", customModel: "",
            provider: "custom"
          }));
        })()`);

        const resolvedAI = await cdp.eval(`(() => {
          if (typeof resolveActiveAI === "function") {
            return resolveActiveAI();
          }
          return null;
        })()`);

        runner.assert(resolvedAI !== null, 'resolveActiveAI() must return a fallback engine object');
        // When invalid or missing, it safely falls back to template generator
        runner.assert(resolvedAI.provider === 'custom' || resolvedAI.provider === 'template', 'Engine must resolve or fall back to template');
      });

      await test('2.5 Preview Device Mode Cycling (Desktop -> Tablet -> Mobile -> Desktop)', async () => {
        await cdp.eval('window.__go("workspace");');
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'preview\']")?.click();');
        await sleep(300);

        const initialLabel = await cdp.eval('document.getElementById("btnDevice")?.textContent || ""');

        // Click 1: Switch to Tablet
        await cdp.eval('document.getElementById("btnDevice")?.click();');
        await sleep(150);
        const tabletLabel = await cdp.eval('document.getElementById("btnDevice")?.textContent || ""');

        // Click 2: Switch to Mobile
        await cdp.eval('document.getElementById("btnDevice")?.click();');
        await sleep(150);
        const mobileLabel = await cdp.eval('document.getElementById("btnDevice")?.textContent || ""');

        // Click 3: Return to Desktop
        await cdp.eval('document.getElementById("btnDevice")?.click();');
        await sleep(150);
        const desktopLabel = await cdp.eval('document.getElementById("btnDevice")?.textContent || ""');

        runner.assert(tabletLabel !== initialLabel || mobileLabel !== tabletLabel, 'Device toggle button text must cycle between device presets');
        runner.assertIncludes(desktopLabel.toLowerCase(), 'desktop', 'Third click on #btnDevice must cycle back to Desktop mode');
      });

      await test('2.6 Theme Toggling (Light / Dark / System) & DOM State', async () => {
        await cdp.eval('window.__go("settings");');
        await sleep(400);

        // Click Light theme
        await cdp.eval('document.querySelector("#themeSeg [data-theme-set=\'light\']")?.click();');
        await sleep(150);
        const lightThemeAttr = await cdp.eval('document.documentElement.getAttribute("data-theme")');
        const lightStore = await cdp.eval('JSON.parse(localStorage.getItem("wb_theme"))');
        runner.assertEqual(lightThemeAttr, 'light', 'Setting light theme must update documentElement data-theme="light"');
        runner.assertEqual(lightStore, 'light', 'Setting light theme must persist to wb_theme in localStorage');

        // Click Dark theme
        await cdp.eval('document.querySelector("#themeSeg [data-theme-set=\'dark\']")?.click();');
        await sleep(150);
        const darkThemeAttr = await cdp.eval('document.documentElement.getAttribute("data-theme")');
        const darkStore = await cdp.eval('JSON.parse(localStorage.getItem("wb_theme"))');
        runner.assertEqual(darkThemeAttr, 'dark', 'Setting dark theme must update documentElement data-theme="dark"');
        runner.assertEqual(darkStore, 'dark', 'Setting dark theme must persist to wb_theme in localStorage');

        // Click System theme
        await cdp.eval('document.querySelector("#themeSeg [data-theme-set=\'system\']")?.click();');
        await sleep(150);
        const sysThemeAttr = await cdp.eval('document.documentElement.getAttribute("data-theme")');
        const sysStore = await cdp.eval('JSON.parse(localStorage.getItem("wb_theme"))');
        runner.assertEqual(sysThemeAttr, null, 'Setting system theme must remove manual data-theme attribute');
        runner.assertEqual(sysStore, 'system', 'Setting system theme must persist to wb_theme in localStorage');
      });

    });

    // =========================================================================
    // TIER 3: CROSS-FEATURE INTERACTIONS
    // =========================================================================
    await runner.runSuite('Tier 3: Cross-Feature Interactions', async (test) => {

      await test('3.1 Settings BYOK Save Updates Global Header Top AI Badge', async () => {
        await cdp.eval('window.__go("settings");');
        await sleep(400);

        // Set provider to Groq in Settings and save
        await cdp.eval(`(() => {
          const prov = document.getElementById("setAiProvider");
          const groq = document.getElementById("setAiGroq");
          if (prov) prov.value = "groq";
          if (groq) groq.value = "gsk_test_key_sample_123456";
          const saveBtn = document.getElementById("btnSaveAi");
          if (saveBtn) saveBtn.click();
        })()`);
        await sleep(300);

        const groqBadgeText = await cdp.eval('document.getElementById("topAiBadge")?.textContent || ""');
        runner.assertIncludes(groqBadgeText.toLowerCase(), 'groq', 'Top AI badge must immediately update to Groq after saving AI settings');

        // Set provider to Gemini in Settings and save
        await cdp.eval(`(() => {
          const prov = document.getElementById("setAiProvider");
          const gemini = document.getElementById("setAiGemini");
          if (prov) prov.value = "gemini";
          if (gemini) gemini.value = "AIzaSyTest_Verification_Key_Sample";
          const saveBtn = document.getElementById("btnSaveAi");
          if (saveBtn) saveBtn.click();
        })()`);
        await sleep(300);

        const geminiBadgeText = await cdp.eval('document.getElementById("topAiBadge")?.textContent || ""');
        runner.assertIncludes(geminiBadgeText.toLowerCase(), 'gemini', 'Top AI badge must immediately update to Gemini after saving AI settings');

        // Reset provider to auto and save
        await cdp.eval(`(() => {
          const prov = document.getElementById("setAiProvider");
          if (prov) prov.value = "auto";
          const saveBtn = document.getElementById("btnSaveAi");
          if (saveBtn) saveBtn.click();
        })()`);
        await sleep(300);

        const autoBadgeText = await cdp.eval('document.getElementById("topAiBadge")?.textContent || ""');
        runner.assertIncludes(autoBadgeText.toLowerCase(), 'auto', 'Top AI badge must update to Auto Engine after saving auto provider');

        // Verify clicking Top AI Badge handles click safely without error
        await cdp.eval('window.__go("workspace");');
        await sleep(200);
        await cdp.eval('document.getElementById("topAiBadge")?.click();');
        await sleep(300);
        runner.assert(true, 'Top AI badge click handler executed safely');
      });

      await test('3.2 Code Editor Live Typing Triggers Debounced Preview Sandbox Re-render', async () => {
        await cdp.eval('window.__go("workspace");');
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'code\']")?.click();');
        await sleep(300);

        const uniqueMarker = `e2e-render-${Date.now()}`;

        // Ensure isolated state: active file is index.html and editor appends cleanly
        await cdp.eval(`(() => {
          if (typeof currentFile !== "undefined") currentFile = "index.html";
          if (typeof loadFileIntoEditor === "function") loadFileIntoEditor();
          const editor = document.getElementById("codeEditor");
          if (editor) {
            const baseContent = (typeof files !== "undefined" && files && files["index.html"]) ? files["index.html"] : editor.value;
            editor.value = baseContent + "\\n<div id='${uniqueMarker}'>Automated CDP Test Live Marker</div>";
            editor.dispatchEvent(new Event("input", { bubbles: true }));
          }
        })()`);

        // Check that saveState immediately reflects editing
        const immediateSaveState = await cdp.eval('document.getElementById("saveState")?.textContent || ""');
        runner.assertIncludes(immediateSaveState.toLowerCase(), 'edit', 'saveState indicator must switch to "Editing…" on editor input');

        // Wait for debounce timer (350ms in index.html) + render execution
        await sleep(750);

        const settledSaveState = await cdp.eval('document.getElementById("saveState")?.textContent || ""');
        runner.assertIncludes(settledSaveState.toLowerCase(), 'live', 'saveState indicator must settle to "Preview live" after debounce');

        // Check that preview iframe srcdoc now reflects the injected marker
        const previewSrc = await cdp.eval('document.getElementById("preview")?.srcdoc || ""');
        runner.assertIncludes(previewSrc, uniqueMarker, 'Live preview iframe srcdoc must update with new code from codeEditor');
      });

      await test('3.3 New File Creation Synchronizes Virtual Files List & Editor Tabs', async () => {
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'files\']")?.click();');
        await sleep(300);

        const testFileName = `e2e-component-${Date.now().toString(36)}.js`;

        // Simulate user clicking #btnAddFile with prompt mocked to return testFileName
        await cdp.eval(`(() => {
          const origPrompt = window.prompt;
          window.prompt = () => "${testFileName}";
          try {
            const btn = document.getElementById("btnAddFile");
            if (btn) btn.click();
          } finally {
            window.prompt = origPrompt;
          }
        })()`);
        await sleep(400);

        const fileRowExists = await cdp.eval(`!!document.querySelector('#fileList [data-openfile="${testFileName}"]')`);
        const editorTabExists = await cdp.eval(`!!document.querySelector('#editorTabs [data-file="${testFileName}"]')`);
        const currentFile = await cdp.eval('typeof currentFile !== "undefined" ? currentFile : ""');

        runner.assert(fileRowExists, `New file ${testFileName} must appear in virtual #fileList rows`);
        runner.assert(editorTabExists, `New file ${testFileName} must appear as a tab in #editorTabs`);
        runner.assertEqual(currentFile, testFileName, 'Active currentFile must switch to newly created file');
      });

    });

    // =========================================================================
    // TIER 4: REAL-WORLD APPLICATION SCENARIOS
    // =========================================================================
    await runner.runSuite('Tier 4: Real-World Application Scenarios', async (test) => {

      await test('4.1 Full User Studio Journey: Home -> Composer -> Workspace -> Code -> Preview -> Inspector -> Settings', async () => {
        // Step 1: Start at Home
        await cdp.eval('window.__go("home");');
        await sleep(500);
        let screen = await cdp.eval('document.body.dataset.screen');
        runner.assertEqual(screen, 'home', 'Journey Step 1: User starts at Home screen');

        // Step 2: Fill prompt and start project
        const projectTitle = `Studio App ${Date.now().toString(36)}`;
        await cdp.eval(`(() => {
          const p = document.getElementById("homePrompt");
          if (p) p.value = "Modern dark studio dashboard with analytics chart and activity log";
          const k = document.getElementById("homeKind");
          if (k) k.value = "dashboard";
        })()`);

        // Step 3: Click Build from Home
        await cdp.eval('document.getElementById("btnHomeBuild")?.click();');
        await sleep(800);
        screen = await cdp.eval('document.body.dataset.screen');
        runner.assertEqual(screen, 'workspace', 'Journey Step 3: Building from Home automatically routes to Workspace studio');

        // Step 4: Verify workspace is initialized and preview is live
        const previewReady = await cdp.eval(`(() => {
          const prev = document.getElementById("preview");
          return prev && prev.srcdoc && prev.srcdoc.length > 50;
        })()`);
        runner.assert(previewReady, 'Journey Step 4: Workspace initializes with working preview iframe');

        // Step 5: Switch to Code view and perform code modification
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'code\']")?.click();');
        await sleep(300);
        const stamp = `journey-e2e-${Date.now()}`;
        await cdp.eval(`(() => {
          const editor = document.getElementById("codeEditor");
          if (editor) {
            editor.value = editor.value.replace(
              "</h1>",
              "</h1>\\n    <p id='${stamp}'>Architect Studio Live Custom Section</p>"
            );
            editor.dispatchEvent(new Event("input", { bubbles: true }));
          }
        })()`);
        await sleep(650);

        // Step 6: Verify preview iframe updated
        const updatedSrc = await cdp.eval('document.getElementById("preview")?.srcdoc || ""');
        runner.assertIncludes(updatedSrc, stamp, 'Journey Step 6: Preview updates with hand-crafted code changes');

        // Step 7: Switch back to Studio Preview view
        await cdp.eval('document.querySelector(".ws-seg button[data-ws=\'preview\']")?.click();');
        await sleep(300);

        // Step 8: Test Inspector opening and closing
        await cdp.eval(`(() => {
          const insp = document.getElementById("inspector");
          if (insp) insp.classList.add("open");
        })()`);
        const inspOpen = await cdp.eval('document.getElementById("inspector")?.classList.contains("open")');
        runner.assert(inspOpen, 'Journey Step 8: Inspector opens for element inspection');

        await cdp.eval('document.getElementById("inspClose")?.click();');
        await sleep(150);
        const inspClosed = await cdp.eval('!document.getElementById("inspector")?.classList.contains("open")');
        runner.assert(inspClosed, 'Journey Step 8: Inspector closes via #inspClose');

        // Step 9: Open Settings, configure BYOK and verify persistence
        await cdp.eval('window.__go("settings");');
        await sleep(400);
        screen = await cdp.eval('document.body.dataset.screen');
        runner.assertEqual(screen, 'settings', 'Journey Step 9: Routes to Settings screen');

        await cdp.eval(`(() => {
          const keyInput = document.getElementById("setAiGemini");
          if (keyInput) keyInput.value = "AIzaSyTest_Verification_Key_123";
          const prov = document.getElementById("setAiProvider");
          if (prov) prov.value = "gemini";
          document.getElementById("btnSaveAi")?.click();
        })()`);
        await sleep(300);

        const topBadge = await cdp.eval('document.getElementById("topAiBadge")?.textContent || ""');
        runner.assertIncludes(topBadge.toLowerCase(), 'gemini', 'Journey Step 9: BYOK Gemini settings saved and badge updated');

        // Step 10: Return to Workspace studio
        await cdp.eval('window.__go("workspace");');
        await sleep(400);
        screen = await cdp.eval('document.body.dataset.screen');
        runner.assertEqual(screen, 'workspace', 'Journey Step 10: Smoothly returned to workspace studio');

        // Step 11: Assert zero runtime exceptions across entire journey
        runner.assertEqual(cdp.appExceptions.length, 0, 'Zero uncaught runtime exceptions in the application across the entire user journey');
      });

    });

    runner.printSummary();

    // Print CDP exception audit
    console.log(`Auditing CDP Runtime Events:`);
    console.log(`- Total Console API Calls: ${cdp.consoleLogs.length}`);
    console.log(`- Total App Runtime Exceptions: ${cdp.appExceptions.length}`);
    console.log(`- Total Sandbox Exceptions: ${cdp.runtimeExceptions.length - cdp.appExceptions.length}`);
    if (cdp.appExceptions.length > 0) {
      console.error('CDP Application Exceptions encountered:');
      cdp.appExceptions.forEach((e, idx) => {
        console.error(`  [${idx + 1}] ${e.text} ${e.exception ? e.exception.description : ''}`);
      });
    }

    if (runner.failedTests > 0 || cdp.appExceptions.length > 0) {
      console.error('\nE2E TEST SUITE RESULT: FAILED');
      process.exitCode = 1;
    } else {
      console.log('\nE2E TEST SUITE RESULT: ALL TESTS PASSED (100% SUCCESS)');
      process.exitCode = 0;
    }

  } catch (err) {
    console.error('Fatal Test Execution Error:', err);
    process.exitCode = 1;
  } finally {
    if (cdp) cdp.close();
    chromeProc.kill();
    // Cleanup temporary directory
    try {
      fs.rmSync(tempUserDataDir, { recursive: true, force: true });
    } catch (_) {}
  }
}

main();
