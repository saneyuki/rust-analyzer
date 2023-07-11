import * as path from "node:path";
import { Uri } from "vscode";
import { CtxInit } from "./ctx";

function getBundledAssetsUri(ctx: CtxInit, pathname: string): Uri {
    const resolved = path.join(ctx.extensionPath, pathname);
    return Uri.file(resolved);
}

export function getWebViewModulePath(ctx: CtxInit) {
    return getBundledAssetsUri(ctx, "out/webview");
}
