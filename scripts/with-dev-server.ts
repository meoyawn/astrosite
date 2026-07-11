import {
  call,
  main,
  race,
  resource,
  sleep,
  withResolvers,
  type Operation,
} from "effection"

type ProcessIdentity = {
  pgid: number
  pid: number
  state: string
}

type WatchdogMessage = {
  monitorPid: number
  type: "started"
}

type DevServer = {
  process: Bun.Subprocess
  processGroups: Set<number>
}

const siteUrl = process.env.SITE_URL

if (siteUrl === undefined) {
  throw new Error("Expected SITE_URL to identify the managed dev server.")
}

const watchdogArgument = "--dev-server-watchdog"
const monitorArgument = "--dev-server-owner-monitor"
const routesUrl = `${siteUrl}/@vite-static-site/routes.json`
const readinessTimeout = 30_000
const gracefulTimeout = 5_000
const hardTimeout = 5_000
const scriptPath = import.meta.path

function spawnWatchdog(
  started: ReturnType<typeof withResolvers<WatchdogMessage>>,
) {
  return Bun.spawn(
    [process.execPath, scriptPath, watchdogArgument, String(process.pid)],
    {
      cwd: process.cwd(),
      detached: true,
      env: Bun.env,
      ipc(message) {
        if (isWatchdogMessage(message)) {
          started.resolve(message)
        } else {
          started.reject(new Error("Dev-server watchdog sent an invalid message."))
        }
      },
      stderr: "inherit",
      stdout: "inherit",
    },
  )
}

function useDevServer(): Operation<DevServer> {
  return resource(function* (provide) {
    const started = withResolvers<WatchdogMessage>("dev-server watchdog startup")
    const watchdog = spawnWatchdog(started)
    const processGroups = new Set([watchdog.pid])

    try {
      const message = yield* withTimeout(
        started.operation,
        gracefulTimeout,
        "Timed out starting the dev-server watchdog.",
      )
      processGroups.add(message.monitorPid)
      yield* provide({ process: watchdog, processGroups })
    } finally {
      yield* stopProcessGroups(processGroups)
      watchdog.disconnect()
    }
  })
}

function* stopProcessGroups(processGroups: Set<number>): Operation<void> {
  const liveGroups = liveProcessGroups(processGroups)

  if (liveGroups.length === 0) {
    return
  }

  signalProcessGroups(liveGroups, "SIGTERM")
  const graceful = yield* race([
    (function* waitForGone(): Operation<"gone"> {
      yield* waitForProcessGroupsExit(processGroups)
      return "gone"
    })(),
    timeoutValue(gracefulTimeout),
  ])

  if (graceful === "timed-out") {
    signalProcessGroups(liveProcessGroups(processGroups), "SIGKILL")
  }

  yield* withTimeout(
    waitForProcessGroupsExit(processGroups),
    hardTimeout,
    `Timed out stopping process groups ${[...processGroups].join(", ")}.`,
  )
}

function* waitForDevServer(devServer: DevServer): Operation<void> {
  const deadline = Date.now() + readinessTimeout

  while (Date.now() < deadline) {
    if (devServer.process.exitCode !== null) {
      throw new Error(
        `task dev exited with status ${devServer.process.exitCode}.`,
      )
    }

    try {
      const response = yield* call(() =>
        fetch(routesUrl, { signal: AbortSignal.timeout(1_000) }),
      )

      if (response.ok) {
        return
      }
    } catch {
      // Vite has not started accepting requests yet.
    }

    yield* sleep(100)
  }

  throw new Error(`task dev did not become ready at ${siteUrl}.`)
}

function* withTimeout<T>(
  operation: Operation<T>,
  timeout: number,
  message: string,
): Operation<T> {
  return yield* race([
    operation,
    (function* timeoutOperation(): Operation<never> {
      yield* sleep(timeout)
      throw new Error(message)
    })(),
  ])
}

function timeoutValue(timeout: number): Operation<"timed-out"> {
  return (function* timeoutOperation(): Operation<"timed-out"> {
    yield* sleep(timeout)
    return "timed-out"
  })()
}

function processIdentities(): ProcessIdentity[] {
  const result = Bun.spawnSync(["ps", "-axo", "pid=,pgid=,state="])

  if (result.exitCode !== 0) {
    throw new Error(`ps exited with status ${result.exitCode}.`)
  }

  const identities: ProcessIdentity[] = []
  for (const line of result.stdout.toString().split("\n")) {
    const [pidValue, pgidValue, state] = line.trim().split(/\s+/, 3)

    if (pidValue === undefined || pgidValue === undefined || state === undefined) {
      continue
    }

    const pid = Number.parseInt(pidValue, 10)
    const pgid = Number.parseInt(pgidValue, 10)
    if (!Number.isNaN(pid) && !Number.isNaN(pgid)) {
      identities.push({ pgid, pid, state })
    }
  }
  return identities
}

function liveProcessGroups(processGroups: Set<number>): number[] {
  const liveGroups = new Set<number>()
  for (const identity of processIdentities()) {
    if (processGroups.has(identity.pgid) && !identity.state.startsWith("Z")) {
      liveGroups.add(identity.pgid)
    }
  }
  return [...liveGroups]
}

function* waitForProcessGroupsExit(
  processGroups: Set<number>,
): Operation<void> {
  while (liveProcessGroups(processGroups).length > 0) {
    yield* sleep(25)
  }
}

function signalProcessGroups(
  processGroups: readonly number[],
  signal: NodeJS.Signals,
): void {
  for (const processGroup of processGroups) {
    try {
      process.kill(-processGroup, signal)
    } catch (error) {
      if (!isProcessGone(error)) {
        throw error
      }
    }
  }
}

function isProcessGone(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ESRCH"
}

function isWatchdogMessage(value: unknown): value is WatchdogMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    value.type === "started" &&
    "monitorPid" in value &&
    typeof value.monitorPid === "number"
  )
}

async function runWatchdog(ownerValue: string | undefined): Promise<void> {
  const ownerPid = positiveInteger(ownerValue, "owner PID")
  const ownerMonitor = Bun.spawn(
    [
      process.execPath,
      scriptPath,
      monitorArgument,
      String(ownerPid),
      String(process.pid),
    ],
    {
      cwd: process.cwd(),
      detached: true,
      env: Bun.env,
      stderr: "ignore",
      stdin: "ignore",
      stdout: "ignore",
    },
  )
  ownerMonitor.unref()

  const devServer = Bun.spawn(["task", "dev"], {
    cwd: process.cwd(),
    env: Bun.env,
    stderr: "inherit",
    stdout: "inherit",
  })
  process.send?.({ monitorPid: ownerMonitor.pid, type: "started" })
  process.exitCode = await devServer.exited
  process.disconnect?.()
}

async function runOwnerMonitor(
  ownerValue: string | undefined,
  watchdogValue: string | undefined,
): Promise<void> {
  const ownerPid = positiveInteger(ownerValue, "owner PID")
  const watchdogPid = positiveInteger(watchdogValue, "watchdog PID")
  const processGroups = new Set([watchdogPid])

  while (true) {
    const identities = processIdentities()
    const ownerExists = processExists(identities, ownerPid)
    const watchdogExists = processExists(identities, watchdogPid)

    if (!ownerExists || !watchdogExists) {
      signalProcessGroups(liveProcessGroups(processGroups), "SIGKILL")
      await waitForProcessGroupsExitAsync(processGroups)
      return
    }

    await Bun.sleep(25)
  }
}

function processExists(
  identities: readonly ProcessIdentity[],
  pid: number,
): boolean {
  return identities.some(
    identity => identity.pid === pid && !identity.state.startsWith("Z"),
  )
}

async function waitForProcessGroupsExitAsync(
  processGroups: Set<number>,
): Promise<void> {
  const deadline = Date.now() + hardTimeout

  while (
    liveProcessGroups(processGroups).length > 0 &&
    Date.now() < deadline
  ) {
    await Bun.sleep(25)
  }

  if (liveProcessGroups(processGroups).length > 0) {
    process.exitCode = 1
  }
}

function positiveInteger(value: string | undefined, name: string): number {
  const parsed = Number.parseInt(value ?? "", 10)

  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Expected a positive ${name}.`)
  }

  return parsed
}

async function runForeground(command: string[]): Promise<void> {
  await main(function* () {
    if (command.length === 0) {
      throw new Error("Expected a foreground command to run.")
    }

    const devServer = yield* useDevServer()
    yield* waitForDevServer(devServer)

    const foreground = Bun.spawn(command, {
      cwd: process.cwd(),
      env: Bun.env,
      stderr: "inherit",
      stdout: "inherit",
    })
    const exitCode = yield* call(() => foreground.exited)

    if (exitCode !== 0) {
      throw new Error(
        `${command.join(" ")} exited with status ${exitCode}.`,
      )
    }
  })
}

if (process.argv[2] === watchdogArgument) {
  await runWatchdog(process.argv[3])
} else if (process.argv[2] === monitorArgument) {
  await runOwnerMonitor(process.argv[3], process.argv[4])
} else {
  await runForeground(process.argv.slice(2))
}
