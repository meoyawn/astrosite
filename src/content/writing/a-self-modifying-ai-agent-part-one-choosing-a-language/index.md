---
title: "A Self-modifying AI Agent, Part One: Choosing a Language"
description: >-
  Dart wins hot reload for a self-modifying AI agent. Fresh runtime probes show
  why deleting a field disqualifies .NET, despite its method-patching abilities.
updated_at: 2026-11-01
published_at: 2026-10-19
---

I'm choosing Dart for a self-modifying AI agent. Among the modern application
languages I evaluated, it wins on the requirement that matters most to this
project: changing a running program while keeping its state and work alive.

The decision came down to deleting a field. While developing Happen as a
.NET MAUI application targeting `net11.0-maccatalyst`, I removed
`sendShortcut`. With the local file path shortened, this was the response:

```text
[ui] dotnet watch ❌ [Happen.App (net11.0-maccatalyst)] MainPage.cs(3,1): error ENC0033: Deleting field 'sendShortcut' requires restarting the application.
[ui]   ❔ Do you want to restart your app? Yes (y) / No (n) / Always (a) / Never (v)
```

A routine change to the application's data required throwing away the
running application. For an agent that should refactor its own implementation
while working, that is enough to rule out .NET. I need changes to the shape
of the program to participate in hot reload too.

I tested that boundary directly in Dart and .NET 11. Dart removed the field
from a live object while preserving its state and open connection. .NET
restarted. The same restriction showed up outside MAUI, in a small server
with no GUI involved.

## What I want the agent to do

The agent's implementation is the software around the model: its task loop,
context management, tool orchestration, storage, and user interface. I want
that source code in its workspace. Given an objective, it should be able to
inspect its behavior, change the implementation, and measure whether the
change helped.

Suppose I ask it to spend fewer tokens. It might change how it selects context,
summarizes tool output, or groups operations into model calls. If I ask it to
complete more tasks, it might change how it decomposes work or recovers from
failures. If I care about latency, it might change which operations run
concurrently. Those objectives can call for different implementations.

The human supplies the goal and constraints. The agent experiments with how
to meet them. A successful reload only establishes that an edit took effect;
the application still needs evaluations that establish whether the result
became better.

![Illustrative conversation in which an agent profiles its own Dart process, inspects retained objects and its UI, and hot reloads a fix while the conversation continues.](./looking-into-itself.svg)

I also want a desktop application where I can direct that work and inspect
what is happening. A headless deployment on a VPS matters too, but the GUI is
part of the product from the beginning. Its development and inspection tools
belong in the language decision.

That gives me three requirements:

- **Change the running application.** Update behavior and ordinary data
  structures while preserving conversation state, connections, and pending
  work.
- **Inspect it programmatically.** Obtain runtime errors, CPU profiles,
  memory information, and UI structure through tools the agent can call.
- **Ship native code.** Compile the accepted implementation ahead of time,
  without distributing the development compiler and JIT in every release.

The first requirement concerns the development runtime, where the agent
experiments with itself. The third concerns the application I ship. Updating
an AOT release still means building and deploying it. I want an ecosystem
that supports both stages well.

## Test structural edits on existing state

On November 1, 2026, I ran fresh behavior probes on an M1 Pro Mac with 16 GiB
of RAM and macOS 26.4. The runtimes were Dart 3.13.7 and .NET
11.0.0-rc.3.26522.148, using SDK 11.0.100-rc.3.26522.148. The .NET SDK was the
preview toolchain installed for the MAUI application.

The fixtures were a plain Dart HTTP server and a minimal ASP.NET Core server.
Each created a typed state object, a registered named callback, a closure,
and an async operation waiting on a gate controlled by the probe. Each also
accepted a WebSocket connection.

The counter started at `73`. Before editing the source, the controller changed
it to `97` over HTTP and opened the WebSocket. That gave the test actual state
to lose: a restart would produce a new session and restore the counter to
`73`. The closure captured `73` before that mutation, so I could check its
captured value separately from its function body.

I applied Dart edits through the VM Service's `reloadSources` operation.
For .NET, I used `dotnet watch --non-interactive`. That option
[automatically restarts on unsupported edits](https://learn.microsoft.com/en-us/dotnet/core/tools/dotnet-watch#options),
allowing the probe to observe the result rather than stop at a prompt.
A passing live update had to expose the changed code in the same process and
session, retain the counter at `97`, and answer through the original WebSocket.

These were the results for class instances:

| Edit or observation | Dart 3.13.7 | .NET 11 preview |
| --- | --- | --- |
| Delete an existing field | Reloaded; state and original socket preserved | Restarted; state reset and original socket closed |
| Add an integer field initialized to `42` | Existing object read `42`; other state preserved | Existing object read `0`; other state preserved |
| Change a registered named callback's body | Updated | Updated |
| Change a previously captured closure's body | Kept its old body and captured value | Updated its body; retained the captured value |
| Change a procedure suspended at `await` and its helper | Old continuation called the updated helper | Updated continuation called the updated helper |
| Rename the helper used by the suspended procedure | Old procedure kept calling the old helper in this probe | Resumed procedure called the replacement |

I repeated field deletion in three independent launches for Dart classes,
.NET classes, and .NET structs. Dart preserved the process, counter, and
original socket in all three. .NET restarted in all three class cases and
all three struct cases. Adding a field to a .NET struct also required a restart
in its separate probe.

For the other scenarios, the table reports one run each. The reported set
contains sixteen probe runs, each starting from a fresh process. These are
observations about specific edits, not an exhaustive catalog of supported
changes or a reload-speed benchmark.

The field-addition result matters too. Preserving an existing object doesn't
mean running its new constructor or initialization logic. In the C# class
probe, a newly added field declared with an initializer of `42` read as
`0` on the existing instance. Dart supplied `42` in the corresponding edit.
An agent needs to check the resulting state, even when the runtime accepts
the change.

.NET's closure and continuation behavior is useful. It still fails the
structural-edit requirement. An agent can't freely simplify its data model
if deleting one of its fields ends the running session.

## Why .NET and Subsecond fall short here

The MAUI error agrees with Roslyn's
[supported-edit matrix](https://github.com/dotnet/roslyn/blob/main/docs/wiki/EnC-Supported-Edits.md),
which excludes fields from the members that can be deleted during Hot Reload.
Microsoft's [diagnostic reference](https://learn.microsoft.com/en-us/visualstudio/debugger/edit-and-continue-errors)
identifies `ENC0033` as a deletion requiring a restart.

The standalone .NET 11 probes make the consequence concrete. This restriction
doesn't depend on a MAUI page failing to redraw or a XAML reload mechanism
being misconfigured. Removing a field from the server's state was enough
to restart it.

Rust's Subsecond has a comparable boundary. Its
[struct-layout documentation](https://docs.rs/subsecond/0.7.10/subsecond/#struct-layout-and-alignment)
explains that code compiled for a changed layout cannot safely use existing
instances with the old layout. The framework must dispose of or replace
affected state. Subsecond doesn't automatically migrate those structs.
This part of the comparison comes from its documented behavior; I didn't
run Rust in the Dart/.NET probes.

That leaves the application responsible for carrying state across an ordinary
structural edit. I could build a protocol for reconstructing it, or restrict
the agent to edits that preserve existing layouts. Both choices would
constrain the central feature of the project.

Recovering saved conversation history is useful, but a conversation log
doesn't recreate an open stream or an operation halfway through a tool call.
Restarting and replaying work can also repeat side effects. The runtime's
ability to preserve the live application therefore matters independently of
how quickly it can compile a replacement.

Dart provides more of that capability directly. The field-deletion probes
showed the ordinary operation I need: change the object structure, keep the
other values, and continue using the existing connection.

## Dart still has rules for work in flight

Choosing Dart doesn't make arbitrary edits safe. Its
[hot-reload semantics](https://github.com/dart-lang/sdk/blob/main/runtime/docs/hot-reload.md)
preserve function bodies already captured by closures and stack frames.
Later calls can use updated implementations. That explains the combination
in the table: an old async continuation called a newly implemented helper.

The rename probe exposed another consequence. New calls saw the replacement
helper, while the suspended Dart procedure continued calling the old helper.
The source on disk and the work already in progress were executing different
versions of that part of the program.

Happen has also encountered the other failure mode during a real refactor:
a running task resumed and tried to call a helper that had been removed.

```text
NoSuchMethodError: No top-level method 'mcpContext' declared.
Receiver: top-level
Tried calling: mcpContext()
```

That task's history survived, but its turn failed. The small rename probe
didn't reproduce that exception, so retaining a removed helper in one edit
isn't something I can assume for every refactor. The application has to keep
entry points available while active work still depends on them.

My design will keep task state outside long-lived closures and move through
short steps that enter the current implementation. A refactor can retain
a compatibility function until the work using it has finished. Cancellation
must stop the underlying operation, and recovery must account for tool calls
that already produced side effects.

Dart has structural limits as well. The VM treats a field rename as removal
and addition; it can't infer that the new field should inherit the old
field's value. Changes such as altering a class's number of type parameters
or converting a class to an enum require a restart. I have also encountered
a Dart VM crash during a structural edit. The successful probes here establish
the behavior of these cases, while reliability across a whole application's
refactors still needs testing.

Those are constraints I can design around in the chosen runtime. Dart lets
ordinary field additions and removals participate in that design. .NET's
restart requirement for deletion rules it out before I reach the harder
question of coordinating active tasks.

## Flutter makes this useful for the whole application

Flutter brings the same Dart runtime into the desktop UI. After an accepted
[stateful hot reload](https://docs.flutter.dev/tools/hot-reload), it rebuilds
the widget tree against retained state. That makes it possible to change a
view and inspect the result while staying in the current conversation.

The rebuild doesn't rerun `main()` or `initState()`, and it doesn't replace
a suspended agent loop. Initialization and ongoing work still need the
handling described above. Changes to native Swift, Objective-C, Kotlin, or
Java code require a full restart. I want to keep the agent loop and as much
of the application behavior as possible in Dart, where the live-development
workflow applies.

The inspection side is equally important. The official
[Dart and Flutter MCP server](https://github.com/dart-lang/ai/blob/main/pkgs/dart_mcp_server/README.md)
offers hot reload, runtime errors, widget inspection, and access to VM Service
methods. [DevTools](https://docs.flutter.dev/tools/devtools) supplies UI,
CPU, and memory inspection; the
[VM Service](https://github.com/dart-lang/sdk/blob/main/runtime/vm/service/service.md)
exposes the runtime protocol behind tools such as profiling and heap analysis.

These pieces give the agent a supported route from editing its source to
observing the running result. Connecting every useful diagnostic to the
agent still takes integration work. A heap snapshot and a widget tree also
answer different questions from a task evaluation. The application must
connect runtime evidence to completion rates, token use, and elapsed time.

This is why the language choice includes Flutter. I want the agent to operate
the development loop itself, including the application I use to direct it.

## Native deployment and code mode

Dart's development runtime and its native deployment model serve different
parts of the project. [Native compilation](https://dart.dev/tools/dart-compile)
can produce a self-contained executable for the headless host. Flutter has
separate [development and release modes](https://docs.flutter.dev/testing/build-modes)
for the desktop application. The shipped AOT host doesn't hot reload itself;
accepted implementation changes must be rebuilt and deployed.

The agent also needs code mode: writing small programs that compose tool
calls during a session. That is useful in a released application too. It
doesn't require the tool program to use the host's language.

I'm choosing an embedded JavaScript interpreter for that role.
[QuickJS](https://bellard.org/quickjs/) is a small embeddable engine that can
execute those programs inside the host process. Dart owns the application
and its state; the interpreter runs tool programs through a bridge whose
capabilities, limits, and cancellation the host controls.

This keeps the two requirements separate. During development, the agent can
edit its Dart implementation and reload it. In an AOT release, it can still
write new tool programs without carrying the Dart development compiler and
JIT along with the application.

## Dart won hot reload

Dart is the clear choice for this agent among the modern application
languages I evaluated. Its support for structural edits, Flutter's stateful
UI updates, runtime inspection, and native deployment fit the application
I want to build.

The deciding observation is small and concrete: I deleted a field. Dart kept
the running program and its state. .NET required a restart, both in the MAUI
application and in the isolated .NET 11 probes. Subsecond's documented
struct-layout limitation presents the same practical obstacle to changing
a live data model.

I'm building the host in Dart, the desktop UI in Flutter, and code mode around
an embedded interpreter. The next engineering problem is making active tasks
cross reloads reliably, then measuring whether the agent's changes actually
improve its work.
