// NOTE TO INSTRUCTOR: This project is intentionally imperfect.
// See DEMO-NOTES.md for teaching moments.

using DevBoard.Api.Data;
using DevBoard.Api.Endpoints;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<DevBoardContext>(options =>
    options.UseInMemoryDatabase("DevBoard"));

builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.ReferenceHandler =
        System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles);

builder.Services.AddOpenApi();

var app = builder.Build();

// Seed the in-memory database on startup
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<DevBoardContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseDefaultFiles();
app.UseStaticFiles();

app.MapWorkItemEndpoints();
app.MapCommentEndpoints();

app.Run();

// Required for WebApplicationFactory in integration tests
public partial class Program { }
