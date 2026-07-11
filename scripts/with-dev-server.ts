import {
  spawn,
  spawnSync,
  type ChildProcess,
} from "node:child_process"
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
  process: ChildProcess
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
const scriptPath = import.meta.filename

function spawnWatchdog(
  started: ReturnType<typeof withResolvers<WatchdogMessage>>,
) {
  const watchdog = spawn(
    process.execPath,
    [scriptPath, watchdogArgument, String(process.pid)],
    {
      cwd: process.cwd(),
      detached: true,
      env: process.env,
      stdio: ["ignore", "inherit", "inherit", "ipc"],
    },
  )
  watchdog.on("message", message => {
    if (isWatchdogMessage(message)) {
      started.resolve(message)
    } else {
      started.reject(new Error("Dev-server watchdog sent an invalid message."))
    }
  })
  watchdog.on("error", error => started.reject(error))
  return watchdog
}

function useDevServer(): Operation<DevServer> {
  return resource(function* (provide) {
    const started = withResolvers<WatchdogMessage>("dev-server watchdog startup")
    const watchdog = spawnWatchdog(started)
    const processGroups = new Set([childPid(watchdog, "watchdog")])

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
      if (watchdog.connected) {
        watchdog.disconnect()
      }
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
  const result = spawnSync("ps", ["-axo", "pid=,pgid=,state="], {
    encoding: "utf8",
  })

  if (result.status !== 0) {
    throw new Error(`ps exited with status ${result.status}.`)
  }

  const identities: ProcessIdentity[] = []
  for (const line of result.stdout.split("\n")) {
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
  const ownerMonitor = spawn(
    process.execPath,
    [
      scriptPath,
      monitorArgument,
      String(ownerPid),
      String(process.pid),
    ],
    {
      cwd: process.cwd(),
      detached: true,
      env: process.env,
      stdio: "ignore",
    },
  )
  const ownerMonitorPid = childPid(ownerMonitor, "owner monitor")
  ownerMonitor.unref()

  const devServer = spawn("task", ["dev"], {
    cwd: process.cwd(),
    env: process.env,
    stdio: ["ignore", "inherit", "inherit"],
  })
  process.send?.({ monitorPid: ownerMonitorPid, type: "started" })
  process.exitCode = await waitForExit(devServer)
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

    await sleepAsync(25)
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
    await sleepAsync(25)
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

    const [executable, ...arguments_] = command
    if (executable === undefined) {
      throw new Error("Expected a foreground executable to run.")
    }

    const foreground = spawn(executable, arguments_, {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["ignore", "inherit", "inherit"],
    })
    const exitCode = yield* call(() => waitForExit(foreground))

    if (exitCode !== 0) {
      throw new Error(
        `${command.join(" ")} exited with status ${exitCode}.`,
      )
    }
  })
}

function waitForExit(child: ChildProcess): Promise<number> {
  return new Promise((resolve, reject) => {
    child.once("error", reject)
    child.once("exit", code => resolve(code ?? 1))
  })
}

function childPid(child: ChildProcess, name: string): number {
  if (child.pid === undefined) {
    throw new Error(`Expected ${name} process to have a PID.`)
  }

  return child.pid
}

function sleepAsync(timeout: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, timeout))
}

if (process.argv[2] === watchdogArgument) {
  await runWatchdog(process.argv[3])
} else if (process.argv[2] === monitorArgument) {
  await runOwnerMonitor(process.argv[3], process.argv[4])
} else {
  await runForeground(process.argv.slice(2))
}
