using FluentValidation;
using Domain.Tickets;

namespace Application.Validation;

public class CreateTicketRequestValidator : AbstractValidator<CreateTicketRequest>
{
    public CreateTicketRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .MaximumLength(200).WithMessage("Title cannot exceed 200 characters")
            .Matches(@"^[^<>]*$").WithMessage("Title cannot contain < or > characters");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Invalid priority value");
    }
}

public record CreateTicketRequest(string Title, string? Description, TicketPriority Priority);