using DevBoard.Api.Data;
using DevBoard.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DevBoard.Api.Endpoints;

public static class CommentEndpoints
{
    public static void MapCommentEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/workitems/{workItemId:int}/comments").WithTags("Comments");

        group.MapGet("/", ListComments);
        group.MapPost("/", AddComment);
        group.MapDelete("/{commentId:int}", DeleteComment);
    }

    static async Task<IResult> ListComments(int workItemId, DevBoardContext db)
    {
        var exists = await db.WorkItems.AnyAsync(w => w.Id == workItemId);
        if (!exists) return Results.NotFound(new { error = "Work item not found" });

        var comments = await db.Comments
            .Where(c => c.WorkItemId == workItemId)
            .OrderBy(c => c.CreatedAt)
            .ToListAsync();

        return Results.Ok(comments);
    }

    static async Task<IResult> AddComment(int workItemId, Comment comment, DevBoardContext db)
    {
        var exists = await db.WorkItems.AnyAsync(w => w.Id == workItemId);
        if (!exists) return Results.NotFound(new { error = "Work item not found" });

        comment.WorkItemId = workItemId;
        comment.CreatedAt = DateTime.UtcNow;
        db.Comments.Add(comment);
        await db.SaveChangesAsync();

        return Results.Created($"/api/workitems/{workItemId}/comments/{comment.Id}", comment);
    }

    static async Task<IResult> DeleteComment(int workItemId, int commentId, DevBoardContext db)
    {
        var comment = await db.Comments
            .FirstOrDefaultAsync(c => c.Id == commentId && c.WorkItemId == workItemId);

        if (comment is null) return Results.NotFound();

        db.Comments.Remove(comment);
        await db.SaveChangesAsync();
        return Results.NoContent();
    }
}
