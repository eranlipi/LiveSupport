
using System.Text;
using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

using Infrastructure;
using Microsoft.EntityFrameworkCore;
using Application.Auth;
using Domain.Users;
using Domain.Tickets;


var builder = WebApplication.CreateBuilder(args);

// refresh token service
builder.Services.AddScoped<RefreshTokenService>();

// DbContext
builder.Services.AddDbContext<LiveSupportDbContext>(opt =>
    opt.UseSqlServer(builder.Configuration.GetConnectionString("LiveSupport")));
// CORS
var corsOrigins = builder.Configuration.GetSection("Cors:Origins").Get<string[]>() ?? new []{"http://localhost:5173"};
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
	p.WithOrigins(corsOrigins).AllowAnyHeader().AllowAnyMethod().AllowCredentials()));

// JWT
var jwtSection = builder.Configuration.GetSection("Jwt");
var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSection["Key"]!));

builder.Services
	.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
	.AddJwtBearer(opt =>
	{
		opt.TokenValidationParameters = new TokenValidationParameters{
			ValidateIssuer = true,
			ValidateAudience = true,
			ValidateLifetime = true,
			ValidateIssuerSigningKey = true,
			ValidIssuer = jwtSection["Issuer"],
			ValidAudience = jwtSection["Audience"],
			IssuerSigningKey = signingKey,
			ClockSkew = TimeSpan.Zero
		};
	});

builder.Services.AddAuthorization();

// Swagger + Bearer
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
	c.SwaggerDoc("v1", new OpenApiInfo{ Title = "Live Support API", Version = "v1" });
	var jwtScheme = new OpenApiSecurityScheme{
		Name = "Authorization", Type = SecuritySchemeType.Http, Scheme = "bearer",
		BearerFormat = "JWT", In = ParameterLocation.Header, Description = "JWT Bearer"
	};
	c.AddSecurityDefinition("Bearer", jwtScheme);
	c.AddSecurityRequirement(new OpenApiSecurityRequirement{ { jwtScheme, Array.Empty<string>() }});
});

// JwtToolkit service
builder.Services.AddSingleton(new JwtToolkit(
	issuer: jwtSection["Issuer"]!,
	audience: jwtSection["Audience"]!,
	key: jwtSection["Key"]!,
	accessMinutes: int.Parse(jwtSection["AccessTokenMinutes"]!)
));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();


var auth = app.MapGroup("/api/auth");

auth.MapPost("/register", async (RegisterRequest req, LiveSupportDbContext db) =>
{
	if (await db.Users.AnyAsync(u => u.Email == req.Email)) return Results.Conflict("Email exists");
	var user = new User{
		Email = req.Email,
		Name = req.Name,
		PasswordHash = PasswordHasher.Hash(req.Password),
		Role = "agent"
	};
	db.Users.Add(user);
	await db.SaveChangesAsync();
	return Results.Created($"/api/users/{user.Id}", new { ok = true });
});

auth.MapPost("/login", async (LoginRequest req, HttpContext http, JwtToolkit jwt, LiveSupportDbContext db, IConfiguration cfg, RefreshTokenService rts) =>
{
	var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
	if (user == null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
		return Results.Unauthorized();

	var claims = new[]{
		new System.Security.Claims.Claim("sub", user.Id.ToString()),
		new System.Security.Claims.Claim("name", user.Name),
		new System.Security.Claims.Claim("email", user.Email),
		new System.Security.Claims.Claim("role", user.Role)
	};

	var access = jwt.CreateAccessToken(claims);
	var refresh = jwt.CreateRefreshToken();
	await rts.StoreAsync(user.Id, refresh, TimeSpan.FromDays(int.Parse(cfg["Jwt:RefreshTokenDays"]!)),
		http.Connection.RemoteIpAddress?.ToString(), http.Request.Headers.UserAgent.ToString());

	http.Response.Cookies.Append("refresh_token", refresh, new CookieOptions{
		HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict,
		Expires = DateTimeOffset.UtcNow.AddDays(int.Parse(cfg["Jwt:RefreshTokenDays"]!))
	});

	return Results.Ok(new { access_token = access, token_type = "Bearer", expires_in = jwt.AccessExpirySeconds });
});

auth.MapPost("/refresh", async (HttpContext http, JwtToolkit jwt, LiveSupportDbContext db, RefreshTokenService rts, IConfiguration cfg) =>
{
	if (!http.Request.Cookies.TryGetValue("refresh_token", out var oldRefresh) || string.IsNullOrEmpty(oldRefresh))
		return Results.Unauthorized();

	// איתור משתמש לפי refresh (פשטות: נבדוק כל משתמש; לשיפור—טבלת RT עם FK ואינדקסים)
	var hash = RefreshTokenService.Hash(oldRefresh);
	var rt = await db.RefreshTokens.FirstOrDefaultAsync(x => x.TokenHash == hash && x.RevokedAt == null && x.ExpiresAt > DateTime.UtcNow);
	if (rt == null) return Results.Unauthorized();

	var user = await db.Users.FindAsync(rt.UserId);
	if (user == null) return Results.Unauthorized();

	var claims = new[]{
		new System.Security.Claims.Claim("sub", user.Id.ToString()),
		new System.Security.Claims.Claim("name", user.Name),
		new System.Security.Claims.Claim("email", user.Email),
		new System.Security.Claims.Claim("role", user.Role)
	};
	var newAccess = jwt.CreateAccessToken(claims);
	var newRefresh = jwt.CreateRefreshToken();
	await rts.RotateAsync(user.Id, oldRefresh, newRefresh);

	http.Response.Cookies.Append("refresh_token", newRefresh, new CookieOptions{
		HttpOnly = true, Secure = true, SameSite = SameSiteMode.Strict,
		Expires = DateTimeOffset.UtcNow.AddDays(int.Parse(cfg["Jwt:RefreshTokenDays"]!))
	});

	return Results.Ok(new { access_token = newAccess, token_type = "Bearer", expires_in = jwt.AccessExpirySeconds });
});

auth.MapPost("/logout", async (HttpContext http, System.Security.Claims.ClaimsPrincipal user, RefreshTokenService rts) =>
{
	var sub = user.FindFirst("sub")?.Value;
	if (Guid.TryParse(sub, out var userId))
		await rts.RevokeAllAsync(userId);

	http.Response.Cookies.Delete("refresh_token");
	return Results.Ok(new { ok = true });
});

app.MapGet("/api/me", (System.Security.Claims.ClaimsPrincipal u) =>
{
	var sub = u.FindFirst("sub")?.Value;
	return new { user = sub };
}).RequireAuthorization();


var tickets = app.MapGroup("/api/tickets").RequireAuthorization();

tickets.MapGet("/", async (LiveSupportDbContext db, int? status, int? priority) =>
{
	var q = db.Tickets.AsQueryable();
	if (status is not null) q = q.Where(t => (int)t.Status == status);
	if (priority is not null) q = q.Where(t => (int)t.Priority == priority);
	var list = await q.OrderByDescending(t => t.CreatedAt).ToListAsync();
	return Results.Ok(list);
});

tickets.MapPost("/", async (CreateTicketRequest req, LiveSupportDbContext db, System.Security.Claims.ClaimsPrincipal u) =>
{
	var t = new Ticket{ Title = req.Title, Description = req.Description, Priority = req.Priority };
	db.Tickets.Add(t);
	await db.SaveChangesAsync();
	return Results.Created($"/api/tickets/{t.Id}", t);
});

tickets.MapPut("/{id:guid}", async (Guid id, UpdateTicketRequest req, LiveSupportDbContext db) =>
{
	var t = await db.Tickets.FindAsync(id);
	if (t is null) return Results.NotFound();
	t.Title = req.Title ?? t.Title;
	t.Description = req.Description ?? t.Description;
	if (req.Status is not null) t.Status = req.Status.Value;
	if (req.Priority is not null) t.Priority = req.Priority.Value;
	t.AgentId = req.AgentId ?? t.AgentId;
	t.UpdatedAt = DateTime.UtcNow;
	await db.SaveChangesAsync();
	return Results.Ok(t);
});

tickets.MapGet("/{id:guid}", async (Guid id, LiveSupportDbContext db) =>
{
	var t = await db.Tickets.FindAsync(id);
	return t is null ? Results.NotFound() : Results.Ok(t);
});

app.Run();

// Records for requests
record CreateTicketRequest(string Title, string? Description, TicketPriority Priority);
record UpdateTicketRequest(string? Title, string? Description, TicketStatus? Status, TicketPriority? Priority, Guid? AgentId);


record RegisterRequest(string Email, string Password, string Name);
record LoginRequest(string Email, string Password);

sealed class JwtToolkit
{
	private readonly string _issuer, _audience, _key;
	private readonly int _accessMinutes;
	private readonly SymmetricSecurityKey _signingKey;
	public int AccessExpirySeconds => _accessMinutes * 60;

	public JwtToolkit(string issuer, string audience, string key, int accessMinutes)
	{
		_issuer = issuer; _audience = audience; _key = key; _accessMinutes = accessMinutes;
		_signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_key));
	}

	public string CreateAccessToken(IEnumerable<System.Security.Claims.Claim> claims)
	{
		var creds = new SigningCredentials(_signingKey, SecurityAlgorithms.HmacSha256);
		var token = new System.IdentityModel.Tokens.Jwt.JwtSecurityToken(
			issuer: _issuer, audience: _audience, claims: claims,
			expires: DateTime.UtcNow.AddMinutes(_accessMinutes),
			signingCredentials: creds
		);
		return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token);
	}

	public string CreateRefreshToken()
		=> Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
}
