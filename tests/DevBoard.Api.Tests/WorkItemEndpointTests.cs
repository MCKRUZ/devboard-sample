using System.Net;
using System.Net.Http.Json;
using DevBoard.Api.Data;
using DevBoard.Api.Models;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Xunit;

namespace DevBoard.Api.Tests;

// Custom factory creates a fresh in-memory DB per test instance for full isolation.
public sealed class TestWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _dbName = $"TestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            services.RemoveAll<DbContextOptions<DevBoardContext>>();
            services.AddDbContext<DevBoardContext>(options =>
                options.UseInMemoryDatabase(_dbName));
        });
    }
}

public class WorkItemEndpointTests
{
    private HttpClient CreateClient() => new TestWebApplicationFactory().CreateClient();

    [Fact]
    public async Task GetWorkItems_ReturnsOkWithList()
    {
        var client = CreateClient();

        await client.PostAsJsonAsync("/api/workitems",
            new { title = "List test item", status = "todo" });

        var response = await client.GetAsync("/api/workitems");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var items = await response.Content.ReadFromJsonAsync<List<WorkItemSummary>>();
        Assert.NotNull(items);
        Assert.NotEmpty(items);
    }

    [Fact]
    public async Task CreateWorkItem_ReturnsCreatedWithCorrectData()
    {
        var client = CreateClient();
        var newItem = new { title = "Test task", description = "Integration test", assignee = "tester", status = "todo" };

        var response = await client.PostAsJsonAsync("/api/workitems", newItem);

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var created = await response.Content.ReadFromJsonAsync<WorkItem>();
        Assert.NotNull(created);
        Assert.Equal("Test task", created.Title);
        Assert.Equal("todo", created.Status);
        Assert.Equal("tester", created.Assignee);
        Assert.True(created.Id > 0);
    }

    [Fact]
    public async Task GetWorkItemById_ReturnsNotFound_WhenMissing()
    {
        var client = CreateClient();

        var response = await client.GetAsync("/api/workitems/99999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteWorkItem_RemovesItem()
    {
        var client = CreateClient();

        var createRes = await client.PostAsJsonAsync("/api/workitems",
            new { title = "To be deleted", status = "todo" });
        var created = await createRes.Content.ReadFromJsonAsync<WorkItem>();
        Assert.NotNull(created);

        var deleteRes = await client.DeleteAsync($"/api/workitems/{created.Id}");
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);

        var getRes = await client.GetAsync($"/api/workitems/{created.Id}");
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);
    }

    [Fact]
    public async Task AddComment_ThenListComments_ReturnsComment()
    {
        var client = CreateClient();

        var createRes = await client.PostAsJsonAsync("/api/workitems",
            new { title = "Item with comments", status = "todo" });
        var item = await createRes.Content.ReadFromJsonAsync<WorkItem>();
        Assert.NotNull(item);
        Assert.True(item.Id > 0);

        var commentRes = await client.PostAsJsonAsync($"/api/workitems/{item.Id}/comments",
            new { body = "Great progress!", author = "alice" });
        Assert.Equal(HttpStatusCode.Created, commentRes.StatusCode);

        var listRes = await client.GetAsync($"/api/workitems/{item.Id}/comments");
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);

        var comments = await listRes.Content.ReadFromJsonAsync<List<Comment>>();
        Assert.NotNull(comments);
        Assert.Single(comments);
        Assert.Equal("Great progress!", comments[0].Body);
        Assert.Equal("alice", comments[0].Author);
    }

    private record WorkItemSummary(int Id, string Title, string Status, string? Assignee, int CommentCount);
}
