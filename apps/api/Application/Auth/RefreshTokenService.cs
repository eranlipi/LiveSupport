using System.Security.Cryptography;
using System.Text;
using Domain.Auth;
using Infrastructure;
using Microsoft.EntityFrameworkCore;

namespace Application.Auth;

public class RefreshTokenService
{
    private readonly LiveSupportDbContext _db;
    public RefreshTokenService(LiveSupportDbContext db) { _db = db; }

    public static string Hash(string token)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)));

    public async Task StoreAsync(Guid userId, string token, TimeSpan ttl, string? ip, string? ua)
    {
        var rt = new RefreshToken {
            UserId = userId,
            TokenHash = Hash(token),
            ExpiresAt = DateTime.UtcNow.Add(ttl),
            IpAddress = ip, UserAgent = ua
        };
        _db.RefreshTokens.Add(rt);
        await _db.SaveChangesAsync();
    }

    public async Task<bool> IsValidAsync(Guid userId, string token)
    {
        var hash = Hash(token);
        var now = DateTime.UtcNow;
        return await _db.RefreshTokens.AnyAsync(x => x.UserId == userId && x.TokenHash == hash && x.ExpiresAt > now && x.RevokedAt == null);
    }

    public async Task RotateAsync(Guid userId, string oldToken, string newToken)
    {
        var oldHash = Hash(oldToken);
        var newHash = Hash(newToken);
        var existing = await _db.RefreshTokens.FirstOrDefaultAsync(x => x.UserId == userId && x.TokenHash == oldHash && x.RevokedAt == null);
        if (existing != null)
        {
            existing.RevokedAt = DateTime.UtcNow;
            existing.ReplacedByTokenHash = newHash;
        }
        _db.RefreshTokens.Add(new RefreshToken{
            UserId = userId, TokenHash = newHash, ExpiresAt = DateTime.UtcNow.AddDays(30)
        });
        await _db.SaveChangesAsync();
    }

    public async Task RevokeAllAsync(Guid userId)
    {
        var tokens = _db.RefreshTokens.Where(x => x.UserId == userId && x.RevokedAt == null);
        await tokens.ExecuteUpdateAsync(s => s.SetProperty(x => x.RevokedAt, DateTime.UtcNow));
    }
}
