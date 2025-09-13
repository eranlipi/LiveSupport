using Domain.Users;
using Domain.Tickets;
using Domain.Auth;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure;

public class LiveSupportDbContext : DbContext
{
    public LiveSupportDbContext(DbContextOptions<LiveSupportDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Ticket> Tickets => Set<Ticket>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Email).IsUnique();
            e.Property(x => x.Email).IsRequired();
            e.Property(x => x.PasswordHash).IsRequired();
        });

        b.Entity<RefreshToken>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.UserId, x.TokenHash }).IsUnique();
            e.Property(x => x.TokenHash).IsRequired();
        });

        b.Entity<Ticket>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.Status, x.Priority });
            e.Property(x => x.Title).IsRequired().HasMaxLength(200);
        });
    }
}
