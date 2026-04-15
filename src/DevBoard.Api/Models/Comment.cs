namespace DevBoard.Api.Models;

public class Comment
{
    public int Id { get; set; }
    public int WorkItemId { get; set; }
    public string Body { get; set; } = string.Empty;
    public string Author { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public WorkItem? WorkItem { get; set; }
}
