using FluentValidation;
using Domain.Tickets;
using System.Text.RegularExpressions;

namespace Application.Validation;

public class CreateTicketRequestValidator : AbstractValidator<CreateTicketRequest>
{
    private static readonly Regex SafeTextRegex = new(@"^[^<>&""']*$", RegexOptions.Compiled);

    public CreateTicketRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty().WithMessage("Title is required")
            .Length(3, 200).WithMessage("Title must be between 3 and 200 characters")
            .Must(BeValidText).WithMessage("Title contains invalid characters")
            .Must(NotContainOnlyWhitespace).WithMessage("Title cannot be only whitespace");

        RuleFor(x => x.Description)
            .MaximumLength(2000).WithMessage("Description cannot exceed 2000 characters")
            .Must(BeValidText).WithMessage("Description contains invalid characters")
            .When(x => !string.IsNullOrEmpty(x.Description));

        RuleFor(x => x.Priority)
            .IsInEnum().WithMessage("Priority must be Low, Medium, High, or Critical");
    }

    private static bool BeValidText(string? text)
    {
        return string.IsNullOrEmpty(text) || SafeTextRegex.IsMatch(text);
    }

    private static bool NotContainOnlyWhitespace(string text)
    {
        return !string.IsNullOrWhiteSpace(text);
    }
}

public record CreateTicketRequest(string Title, string? Description, TicketPriority Priority);