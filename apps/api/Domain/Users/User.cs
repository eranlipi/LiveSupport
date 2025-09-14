using System.Text.RegularExpressions;

namespace Domain.Users;

public enum UserRole { Agent, Admin, Customer }

public class User
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Email { get; private set; } = default!;
    public string PasswordHash { get; private set; } = default!;
    public string Name { get; private set; } = default!;
    public UserRole Role { get; private set; } = UserRole.Agent;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; private set; }
    public bool IsActive { get; private set; } = true;

    private static readonly Regex EmailRegex = new(@"^[^\s@]+@[^\s@]+\.[^\s@]+$", RegexOptions.Compiled);

    private User() { }

    public static User Create(string email, string passwordHash, string name, UserRole role = UserRole.Agent)
    {
        if (string.IsNullOrWhiteSpace(email))
            throw new ArgumentException("Email cannot be empty", nameof(email));

        if (!EmailRegex.IsMatch(email))
            throw new ArgumentException("Invalid email format", nameof(email));

        if (string.IsNullOrWhiteSpace(passwordHash))
            throw new ArgumentException("Password hash cannot be empty", nameof(passwordHash));

        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty", nameof(name));

        if (name.Length > 100)
            throw new ArgumentException("Name cannot exceed 100 characters", nameof(name));

        return new User
        {
            Email = email.ToLowerInvariant().Trim(),
            PasswordHash = passwordHash,
            Name = name.Trim(),
            Role = role
        };
    }

    public void UpdatePassword(string newPasswordHash)
    {
        if (string.IsNullOrWhiteSpace(newPasswordHash))
            throw new ArgumentException("Password hash cannot be empty", nameof(newPasswordHash));

        PasswordHash = newPasswordHash;
    }

    public void UpdateName(string name)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Name cannot be empty", nameof(name));

        if (name.Length > 100)
            throw new ArgumentException("Name cannot exceed 100 characters", nameof(name));

        Name = name.Trim();
    }

    public void RecordLogin()
    {
        LastLoginAt = DateTime.UtcNow;
    }

    public void Deactivate()
    {
        IsActive = false;
    }

    public void Activate()
    {
        IsActive = true;
    }
}