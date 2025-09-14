using FluentValidation;
using Domain.Tickets;

namespace Application.Validation;

public class UpdateTicketRequestValidator : AbstractValidator<UpdateTicketRequest>
{
    public UpdateTicketRequestValidator()
    {
        RuleFor(x => x.Title)
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters")
            .Matches(@"^[^<>]*$").WithMessage("Title cannot contain < or > characters")
            .When(x => !string.IsNullOrEmpty(x.Title));

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Status)
            .IsInEnum().WithMessage("Invalid status value")
            .When(x => x.Status.HasValue);

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Invalid priority value")
            .When(x => x.Priority.HasValue);
    }
}

public record UpdateTicketRequest(string? Title, string? Description, TicketStatus? Status, TicketPriority? Priority, Guid? AgentId);