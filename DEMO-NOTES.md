# DevBoard — Demo Teaching Moments

This file is for instructors. Each section describes one intentional code smell, where it lives, and a prompt you can paste into an AI agent to find and fix it during the demo.

---

## Teaching Moment 1 — Method That Does Too Much

**File:** `src/DevBoard.Api/Endpoints/WorkItemEndpoints.cs`
**Method:** `GetAll` (~line 25)

**What's wrong:** The `GetAll` handler is responsible for filtering by assignee, sorting, executing the query, and shaping the response projection — all in one block. It violates the Single Responsibility Principle and would be hard to unit test in isolation.

**Demo prompt:**
> Look at the `GetAll` method in `WorkItemEndpoints.cs`. It handles filtering, sorting, querying, and response shaping all in one place. Refactor it so each concern is separate. Extract a `BuildQuery` helper that takes the filter/sort parameters and returns an `IQueryable<WorkItem>`, and a separate response projection record.

---

## Teaching Moment 2 — Magic Strings

**File:** `src/DevBoard.Api/Endpoints/WorkItemEndpoints.cs` (also in `WorkItem.cs`, `DevBoardContext.cs`, `index.html`)
**Lines:** Scattered — `"todo"`, `"in-progress"`, `"done"` appear in at least 6 places.

**What's wrong:** Status values are raw strings with no single source of truth. A typo compiles silently. There's no IDE support, no exhaustiveness checking.

**Demo prompt:**
> Search the entire solution for the string literals `"todo"`, `"in-progress"`, and `"done"` used as status values. Create a `WorkItemStatus` static class (or enum with a converter) that centralises these values, then replace every occurrence. Make sure the API still accepts the same JSON strings.

---

## Teaching Moment 3 — Missing Input Validation

**File:** `src/DevBoard.Api/Endpoints/WorkItemEndpoints.cs`
**Method:** `Create` (~line 65)

**What's wrong:** The `Create` handler accepts whatever the client sends. `Title` can be null, empty, or 10,000 characters. `Status` can be `"banana"`. There is no 400 response for bad input.

**Demo prompt:**
> The `Create` endpoint in `WorkItemEndpoints.cs` has no input validation. Add a `CreateWorkItemRequest` record with validation logic: `Title` is required and max 200 characters, `Status` must be one of the valid values, `Assignee` is optional but max 100 characters. Return a `400 Bad Request` with a descriptive error body when validation fails.

---

## Teaching Moment 4 — Console.WriteLine Instead of Structured Logging

**File:** `src/DevBoard.Api/Endpoints/WorkItemEndpoints.cs`
**Method:** `Update` (~line 95)

**What's wrong:** The status transition audit uses `Console.WriteLine`. In production this goes nowhere useful, isn't queryable, and bypasses the ASP.NET Core logging pipeline entirely. The method is also too long — it mixes business validation, persistence, and logging.

**Demo prompt:**
> In the `Update` method of `WorkItemEndpoints.cs`, replace the `Console.WriteLine` call with a proper `ILogger` call. Then extract the status transition validation logic into a private static method called `ValidateStatusTransition(string from, string to)` that returns a `bool`, and inject `ILogger` via the endpoint delegate's parameters. The `Update` handler should shrink to under 20 lines.

---

## Bonus Demo — Write a Missing Test

**What's missing:** There is no test for the invalid status transition guard in the `Update` endpoint (e.g., transitioning directly from `"todo"` to `"done"` should return `400`).

**Demo prompt:**
> There's no integration test covering invalid status transitions. In `WorkItemEndpointTests.cs`, add a test called `UpdateWorkItem_InvalidStatusTransition_ReturnsBadRequest` that creates a work item with status `"todo"`, then tries to PUT it with status `"done"` (skipping `"in-progress"`), and asserts a `400 Bad Request` response.
