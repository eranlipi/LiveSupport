using FluentValidation;
using Domain.Users;
using System.Text.RegularExpressions;

namespace Application.Validation;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    private static readonly Regex EmailRegex = new(@"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", RegexOptions.Compiled);
    private static readonly Regex NameRegex = new(@"^[a-zA-Z\s\-'\.]{2,}$", RegexOptions.Compiled);
    private static readonly Regex PasswordRegex = new(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$", RegexOptions.Compiled);

    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required")
            .Length(5, 255).WithMessage("Email must be between 5 and 255 characters")
            .Must(BeValidEmail).WithMessage("Please enter a valid email address");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required")
            .Length(8, 128).WithMessage("Password must be between 8 and 128 characters")
            .Must(BeStrongPassword).WithMessage("Password must contain at least one lowercase letter, one uppercase letter, one digit, and one special character (@$!%*?&)")
            .Must(NotContainCommonPatterns).WithMessage("Password contains common patterns that are not secure");

        RuleFor(x => x.Name)
            .NotEmpty().WithMessage("Name is required")
            .Length(2, 100).WithMessage("Name must be between 2 and 100 characters")
            .Must(BeValidName).WithMessage("Name can only contain letters, spaces, hyphens, apostrophes, and periods")
            .Must(NotContainOnlyWhitespace).WithMessage("Name cannot be only whitespace");

        RuleFor(x => x.Role)
            .IsInEnum().WithMessage("Role must be Agent, Admin, or Customer")
            .When(x => x.Role.HasValue);
    }

    private static bool BeValidEmail(string email)
    {
        return EmailRegex.IsMatch(email);
    }

    private static bool BeStrongPassword(string password)
    {
        return PasswordRegex.IsMatch(password);
    }

    private static bool NotContainCommonPatterns(string password)
    {
        var commonPatterns = new[]
        {
            "123456", "password", "qwerty", "abc123", "admin", "letmein",
            "welcome", "monkey", "dragon", "master", "hello", "superman"
        };

        var lowerPassword = password.ToLowerInvariant();
        return !commonPatterns.Any(pattern => lowerPassword.Contains(pattern));
    }

    private static bool BeValidName(string name)
    {
        return NameRegex.IsMatch(name);
    }

    private static bool NotContainOnlyWhitespace(string text)
    {
        return !string.IsNullOrWhiteSpace(text);
    }
}

public record RegisterRequest(string Email, string Password, string Name, UserRole? Role = null);