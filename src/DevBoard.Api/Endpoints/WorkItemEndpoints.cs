using DevBoard.Api.Data;
using DevBoard.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DevBoard.Api.Endpoints;

public static class WorkItemEndpoints
{
    public static void MapWorkItemEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/workitems").WithTags("WorkItems");

        group.MapGet("/", GetAll);
        group.MapGet("/{id:int}", GetById);
        group.MapPost("/", Create);
        group.MapPut("/{id:int}", Update);
        group.MapDelete("/{id:int}", Delete);
        group.MapGet("/status/{status}", GetByStatus);
    }

    // TEACHING MOMENT #1: This method does too much — fetching, filtering, sorting,
    // AND shaping the response all in one block. A real agent can spot this and
    // suggest splitting into smaller focused methods or a query object.
    static async Task<IResult> GetAll(DevBoardContext db, string? assignee, string? sort)
    {
        var query = db.WorkItems.Include(w => w.Comments).AsQueryable();

        if (!string.IsNullOrWhiteSpace(assignee))
            query = query.Where(w => w.Assignee == assignee);

        if (sort == "oldest")
            query = query.OrderBy(w => w.CreatedAt);
        else if (sort == "title")
            query = query.OrderBy(w => w.Title);
        else
            query = query.OrderByDescending(w => w.CreatedAt);

        var items = await query.ToListAsync();

        // TEACHING MOMENT #2: Magic string — "todo", "in-progress", "done" are
        // repeated throughout the codebase with no single source of truth.
        // An agent can find all occurrences and suggest an enum or constants class.
        var result = items.Select(w => new
        {
            w.Id,
            w.Title,
            w.Description,
            w.Status,
            w.Assignee,
            w.CreatedAt,
            CommentCount = w.Comments.Count,
            IsOverdue = w.Status != "done" && w.CreatedAt < DateTime.UtcNow.AddDays(-7)
        });

        return Results.Ok(result);
    }

    static async Task<IResult> GetById(int id, DevBoardContext db)
    {
        var item = await db.WorkItems
            .Include(w => w.Comments)
            .FirstOrDefaultAsync(w => w.Id == id);

        return item is null ? Results.NotFound() : Results.Ok(item);
    }

    // TEACHING MOMENT #3: No input validation. Title could be null/empty/whitespace,
    // Status could be any arbitrary string. An agent can add a validation helper
    // or FluentValidation, and return 400 with a clear error message.
    static async Task<IResult> Create(WorkItem item, DevBoardContext db)
    {
        item.CreatedAt = DateTime.UtcNow;
        db.WorkItems.Add(item);
        await db.SaveChangesAsync();
        return Results.Created($"/api/workitems/{item.Id}", item);
    }

    // TEACHING MOMENT #4: Overly long method — update, status transition logging,
    // and response shaping are all crammed here. Extracting a ValidateStatusTransition
    // helper would make this readable and testable in isolation.
    static async Task<IResult> Update(int id, WorkItem updated, DevBoardContext db)
    {
        var item = await db.WorkItems.FindAsync(id);
        if (item is null) return Results.NotFound();

        var oldStatus = item.Status;
        item.Title = updated.Title;
        item.Description = updated.Description;
        item.Assignee = updated.Assignee;

        // Inline status transition guard that should be its own method
        var validTransitions = new Dictionary<string, string[]>
        {
            { "todo",        new[] { "in-progress" } },
            { "in-progress", new[] { "todo", "done" } },
            { "done",        new[] { "in-progress" } },
        };

        if (updated.Status != oldStatus)
        {
            if (!validTransitions.TryGetValue(oldStatus, out var allowed) || !allowed.Contains(updated.Status))
            {
                return Results.BadRequest(new { error = $"Invalid transition from '{oldStatus}' to '{updated.Status}'" });
            }
            item.Status = updated.Status;
            Console.WriteLine($"[WorkItem {id}] Status changed from {oldStatus} to {updated.Status}");
        }

        await db.SaveChangesAsync();
        return Results.Ok(item);
    }

    static async Task<IResult> Delete(int id, DevBoardContext db)
    {
        var item = await db.WorkItems.FindAsync(id);
        if (item is null) return Results.NotFound();

        db.WorkItems.Remove(item);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }

    static async Task<IResult> GetByStatus(string status, DevBoardContext db)
    {
        var items = await db.WorkItems
            .Where(w => w.Status == status)
            .OrderByDescending(w => w.CreatedAt)
            .ToListAsync();

        return Results.Ok(items);
    }
}
