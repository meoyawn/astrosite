# WebKit/Safari `evaluate()` Fallback Investigation

Updated: 2026-04-11

## Scope

Investigating whether the WebKit-specific fallback in
[screenshot.ts](/Users/adelnizamutdinov/Projects/astrosite/scripts/screenshot.ts:49)
is still necessary:

- `isRecoverableWebKitEvaluateError()`
- `withWebKitFallback()`
- recovery on `"Completion handler for function call is no longer reachable"`

## Current conclusion

Current public evidence does not support treating this as a general
Safari/WebKit requirement.

The fallback may still be justified as a Bun-specific workaround if there is a
reproducible local failure, but I have not found a current public WebKit/Safari
issue showing that valid `callAsyncJavaScript` / `evaluate()` flows
intermittently need timed sleeps.

## Findings

- The exact error string is a real `WKWebView.callAsyncJavaScript` error, but
  the clearest public example is caused by incorrect JavaScript, not an engine
  bug.
- A public discussion of Apple's older `callAsyncJavaScript` sample shows that
  using `setTimeout("f(42)", 1000)` breaks because string callbacks run in
  global scope and lose access to the local `f`, leaving the promise unresolved
  and producing `"Completion handler for function call is no longer reachable"`.
- Bun's March 20, 2026 `Bun.WebView` landing commit documents WebKit
  `evaluate()` as a bridge to `callAsyncJavaScript`, with WebKit awaiting the
  returned promise server-side. I did not find a Bun issue or follow-up fix
  describing intermittent WebKit callback loss for otherwise valid scripts.
- Apple documentation still presents `callAsyncJavaScript` as the normal async
  execution API for `WKWebView`. I did not find an official note saying
  Safari/WebKit requires fallback sleeps here.

## Interpretation

- The current comment in `screenshot.ts` overstates confidence if it implies
  this is a known Safari/WebKit quirk.
- A narrower description would be more accurate: project-specific Bun WebView
  workaround for an observed error string.
- If the project has a reproducible failure case, keeping the fallback can still
  be pragmatic.
- Without a repro or linked upstream issue, the fallback currently looks more
  like defensive masking than a documented platform requirement.

## Sources

- Apple `WKWebView` docs:
  https://developer.apple.com/documentation/webkit/wkwebview
- Stack Overflow discussion of the `callAsyncJavaScript` sample and error:
  https://stackoverflow.com/questions/68159014/is-use-of-settimeout-1000-in-promise-example-possible-with-callasyncjavas
- MDN `setTimeout` docs explaining string-code execution:
  https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
- Bun `Bun.WebView` landing commit (`#28185`, 2026-03-20):
  https://github.com/oven-sh/bun/commit/010dfa159f7eb8c8fe13bf7673815214f11d4955

## Remaining gap

Still missing:

- a direct WebKit bug report confirming an intermittent engine bug for valid
  async scripts
- a Bun issue documenting this exact failure mode in `Bun.WebView.evaluate()`
- a local minimal repro that demonstrates the failure on this machine with
  current Bun/WebKit
