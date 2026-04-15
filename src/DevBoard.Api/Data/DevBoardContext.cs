using DevBoard.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace DevBoard.Api.Data;

public class DevBoardContext(DbContextOptions<DevBoardContext> options) : DbContext(options)
{
    public DbSet<WorkItem> WorkItems => Set<WorkItem>();
    public DbSet<Comment> Comments => Set<Comment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<WorkItem>()
            .HasMany(w => w.Comments)
            .WithOne(c => c.WorkItem)
            .HasForeignKey(c => c.WorkItemId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<WorkItem>().HasData(
            new WorkItem { Id = 1, Title = "Set up CI pipeline", Description = "Configure GitHub Actions for build and test", Status = "done", Assignee = "alice", CreatedAt = DateTime.UtcNow.AddDays(-5) },
            new WorkItem { Id = 2, Title = "Design database schema", Description = "ERD for the core entities", Status = "in-progress", Assignee = "bob", CreatedAt = DateTime.UtcNow.AddDays(-3) },
            new WorkItem { Id = 3, Title = "Implement auth middleware", Description = "JWT validation and role claims", Status = "todo", Assignee = null, CreatedAt = DateTime.UtcNow.AddDays(-1) }
        );
    }
}
