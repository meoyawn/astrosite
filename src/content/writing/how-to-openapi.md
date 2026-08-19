---
title: How to OpenAPI
description: Author contracts in TypeScript, then generate focused Go and TypeScript code.
published_at: 2026-08-15
---

The OpenAPI Specification (OAS) unlocks a surprising amount of infrastructure
from one contract: documentation, clients, server models, request validation,
security wiring, contract tests, mocks, CLIs, and MCP servers.

Maintaining that contract directly is painful. Large YAML or JSON documents
repeat themselves, make refactors risky, and give coding agents few guardrails
beyond a schema validator. OpenAPI is a good interchange format and a poor
authoring format.

In [Listenbox](https://listenbox.app/), we author OpenAPI 3.2 with
[ResponsibleAPI](https://github.com/responsibleapi/responsible), a small
TypeScript DSL that compiles to standard OpenAPI YAML or JSON.

```ts
const ShowID = () => string({ pattern: "^shw_" })
const Show = () => object({ id: ShowID, title: string() })

responsibleAPI({
  partialDoc: { openapi: "3.2.0", info: { title: "API", version: "1" } },
  routes: {
    "/shows/:show_id": GET({
      id: "getShow",
      req: { pathParams: { show_id: ShowID } },
      res: { 200: resp({ body: Show }) },
    }),
  },
})
```

TypeScript makes the source maintainable. Schemas are ordinary exported values:
split them into ES modules, import them into several contracts, compose them,
rename them, and let the language server update every use. Raw YAML or JSON
requires awkward cross-file `$ref`s for the same job, and many OpenAPI tools do
not resolve them consistently.

ResponsibleAPI does not mirror the module graph as external OpenAPI references.
The compiler follows the imports and bundles everything into one self-contained
document for maximum tooling compatibility. Source stays DRY and refactorable;
every consumer gets plain portable OAS.

Compiler errors also catch invalid composition. That gives coding agents named
domain concepts and fast feedback instead of an enormous untyped document.
ResponsibleAPI ships a matching
[agent skill](https://github.com/responsibleapi/responsible/blob/master/SKILL.md).

GUI-first OpenAPI editors like [Stoplight](https://stoplight.io/) are going to
die in the age of LLMs. Click-driven authoring hides intent from agents, while
typed source gives them symbols, imports, diffs, compiler errors, and safe
refactors. Governance and documentation still matter; the GUI as the primary
contract editor does not.

## Generate clients and types

Our build first typechecks the ResponsibleAPI sources, then compiles them to
OpenAPI 3.2. YAML and JSON are build artifacts for the ecosystem, not the source
of truth.

The compiled contracts feed [OASmith](https://github.com/responsibleapi/oasmith),
which generates focused Go models and HTTP clients, TypeScript clients, and Go
configuration structs. Shared source schemas therefore stay shared across
servers, web apps, CLIs, and configuration parsing.

OASmith is deliberately focused. For our contract subset it is a much smaller,
faster, and simpler replacement for the JVM-based
[`openapi-generator`](https://github.com/OpenAPITools/openapi-generator), while
supporting OpenAPI 3.2 and both Go and TypeScript clients.

[`oapi-codegen`](https://github.com/oapi-codegen/oapi-codegen) also supports
OpenAPI 3.2 and is a strong lightweight choice for Go, but it does not generate
TypeScript clients. OASmith covers both sides of our stack without bringing in
a general-purpose generator.

## Build and validate the router

OAS can drive the server at runtime too. With Go and Echo, use
[`echo-openapi-router`](https://github.com/responsibleapi/echo-openapi-router):

```go
builder, err := openapirouter.LoadFromFile("openapi.yaml", validator.Options{})
if err != nil {
    return err
}

builder.Security("ApiKeyAuth", checkAPIKey)
builder.AddRoute("getShow", getShow)

if err := builder.Mount(e); err != nil {
    return err
}
```

The router builds paths and methods from the contract. Bind each handler by its
OpenAPI `operationId`, register handlers for security scheme names, then mount
the result into Echo. Incoming requests are validated before application code
runs. An operation without a handler remains visible and returns `501 Not
Implemented`, rather than silently disappearing from the server.

Java teams can use the same pattern with
[`vertx-web-openapi-router`](https://vertx.io/docs/vertx-web-openapi-router/java/),
which inspired the Echo implementation:

```java
RouterBuilder builder = RouterBuilder.create(vertx, contract);
builder.getRoute("getShow").addHandler(this::getShow);
builder.security("api_key").apiKeyHandler(APIKeyHandler.create(provider));
Router router = builder.createRouter();
```

Again, the contract creates the router; `operationId` selects a route; security
schemes attach authentication; validated inputs reach the handler.

## Contract-test the real server

[`test-go`](https://github.com/responsibleapi/test-go) closes the loop. Load the
same compiled contract, point it at a running test server, and address requests
by `operationId`:

```go
api, err := responsibleapi.LoadFromFile("openapi.yaml", responsibleapi.Options{
    BaseURL: server.URL,
    Client:  client,
})
if err != nil {
    return err
}

response := api.Check(t, responsibleapi.CheckOptions{
    OperationID: "getShow",
    Request: responsibleapi.RequestOptions{
        PathParams: map[string]string{"show_id": "shw_123"},
    },
    Expected: http.StatusOK,
})
defer response.Body.Close()
```

The helper constructs the request from the operation and validates the response
against OAS. This catches drift that generated types alone cannot: wrong status
codes, headers, content types, or response bodies from the real handler.

The result is one pipeline: expressive TypeScript in, standard OpenAPI 3.2 in
the middle, then generated code, validated routing, and contract tests out.
Humans get normal refactoring tools. Agents get guardrails. Every downstream
consumer gets a standard contract.

[ResponsibleAPI.com](https://responsibleapi.com/) might or might not grow into
an SDK product similar to [Stainless](https://www.stainless.com/). For now, the
open-source toolchain already solves the part we need: maintainable contracts
and focused code generation.
