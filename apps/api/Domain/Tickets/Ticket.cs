namespace Domain.Tickets;

public enum TicketStatus { Open, InProgress, Resolved }
public enum TicketPriority { Low, Medium, High, Critical }

public class Ticket
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Title { get; private set; } = default!;
    public string? Description { get; private set; }
    public TicketStatus Status { get; private set; } = TicketStatus.Open;
    public TicketPriority Priority { get; private set; } = TicketPriority.Medium;
    public Guid? AgentId { get; private set; }
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; private set; }

    private Ticket() { }

    public static Ticket Create(string title, string? description, TicketPriority priority)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty", nameof(title));

        if (title.Length > 200)
            throw new ArgumentException("Title cannot exceed 200 characters", nameof(title));

        return new Ticket
        {
            Title = title.Trim(),
            Description = description?.Trim(),
            Priority = priority
        };
    }

    public void UpdateTitle(string title)
    {
        if (string.IsNullOrWhiteSpace(title))
            throw new ArgumentException("Title cannot be empty", nameof(title));

        if (title.Length > 200)
            throw new ArgumentException("Title cannot exceed 200 characters", nameof(title));

        Title = title.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDescription(string? description)
    {
        Description = description?.Trim();
        UpdatedAt = DateTime.UtcNow;
    }

    public void AssignToAgent(Guid agentId)
    {
        AgentId = agentId;
        Status = TicketStatus.InProgress;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Resolve()
    {
        Status = TicketStatus.Resolved;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Reopen()
    {
        if (Status == TicketStatus.Resolved)
        {
            Status = TicketStatus.Open;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}
