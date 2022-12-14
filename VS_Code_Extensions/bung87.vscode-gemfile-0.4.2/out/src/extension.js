"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const gemfile = require("gemfile");
const vscode = require("vscode");
var cache = new Map();
class GemfileProvider {
    provideHover(document, position, token) {
        let gemRange = document.getWordRangeAtPosition(position, /([A-Za-z\/0-9_-]+)(\.[A-Za-z0-9]+)*/);
        if (!gemRange) {
            return;
        }
        console.log(`gemRange${gemRange.start.line}:${gemRange.end.line}`);
        let gem = document.getText(gemRange);
        let lineText = document.lineAt(position.line).text.trim();
        if (lineText.startsWith("//") ||
            lineText.startsWith("#") ||
            lineText.startsWith("source")) {
            return;
        }
        if (!gem || [
            "require",
            "true",
            "false",
            "group",
            "development",
            "test",
            "production",
            "do",
            "gem"
        ].indexOf(gem) !== -1) {
            return;
        }
        if (/^[^a-zA-Z]+$/.test(gem)) {
            console.log("no alphabet");
            return;
        }
        var endpoint;
        let specs = cache.get(document.uri.fsPath);
        var str;
        if (gem in specs) {
            let version = specs[gem].version;
            endpoint = `${gem}/${version}`;
        }
        else {
            let src = lineText
                .split(",")[1]
                .replace(/["\s]/g, "")
                .replace(":", ".com");
            let url = `https://${src}`;
            str = `View [${url}](${url})`;
        }
        if (endpoint) {
            str = `View online docs for [${endpoint}](https://www.rubydoc.info/gems/${endpoint})`;
        }
        let doc = new vscode.MarkdownString(str);
        let link = new vscode.Hover(doc, gemRange);
        return link;
    }
}
function activate(context) {
    const GemFile = {
        // language: "ruby", may not identical as ruby file so commented this
        pattern: "**/Gemfile",
        scheme: "file"
    };
    var mine_uris = [];
    vscode.workspace
        .findFiles("**/Gemfile.lock")
        .then(uris => {
        mine_uris = uris.map(uri => uri.fsPath.substring(0, uri.fsPath.length - 5));
        return Promise.all(uris.map(uri => gemfile.parse(uri.fsPath)));
    })
        .then(infos => {
        for (let i in mine_uris) {
            cache.set(mine_uris[i], infos[i].GEM.specs);
        }
    });
    let disposable = vscode.languages.registerHoverProvider(GemFile, new GemfileProvider());
    let watcher = vscode.workspace.createFileSystemWatcher("**/Gemfile");
    watcher.onDidChange((uri) => {
        let specs = gemfile.parseSync(uri.fsPath).GEM.specs;
        cache.set(uri.fsPath.substring(0, uri.fsPath.length - 5), specs);
    });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
    cache = null;
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map