using FluentValidation;
using System.Text.RegularExpressions;

namespace Application.Validation;

public class LoginRequestValidator : AbstractValidator<LoginRequest>
{
    private static readonly Regex EmailRegex = new(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", RegexOptions.Compiled);

    public LoginRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .Length(5, 255).WithMessage("Email must be between 5 and 255 characters")
            .Must(BeValidEmail).WithMessage("Please enter a valid email address");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .Length(1, 500).WithMessage("Password length is invalid")
            .Must(NotContainOnlyWhitespace).WithMessage("Password cannot be only whitespace");
    }

    private static bool BeValidEmail(string email)
    {
        return EmailRegex.IsMatch(email);
    }

    private static bool NotContainOnlyWhitespace(string text)
    {
        return !string.IsNullOrWhiteSpace(text);
    }
}

public record LoginRequest(string Email, string Password);