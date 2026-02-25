using AuthService.Data;
using AuthService.Data.Auth;
using AuthService.Repositories;
using AuthService.ServiceCalls.Logger;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using System.Text;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddDbContext<AuthDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("AuthDb")));


builder.Services.AddScoped<UserRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IAuthHelper, AuthHelper>();
builder.Services.AddScoped<IServiceLogger, ServiceLogger>();


builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "AuthService API", Version = "v1" });

    // JWT Authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Unesite 'Bearer {token}'"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            new string[]{ }
        }
    });
});

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"],
        ValidAudience = builder.Configuration["Jwt:Issuer"],
        IssuerSigningKey = new SymmetricSecurityKey(
            Convert.FromBase64String(builder.Configuration["Jwt:Key"])),
        ClockSkew = TimeSpan.FromMinutes(5),
          RoleClaimType = ClaimTypes.Role,
          NameClaimType = ClaimTypes.Name
    };

    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var raw = context.Request.Headers["Authorization"].ToString();
            Console.WriteLine($"[DEBUG] OnMessageReceived - Raw Authorization header: '{raw}'");

            if (!string.IsNullOrEmpty(raw) && raw.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                context.Token = raw.Substring("Bearer ".Length).Trim();
            else
                context.Token = raw;

            // persist token for later handlers (AuthenticationFailed doesn't expose Token)
            if (!string.IsNullOrEmpty(context.Token))
                context.HttpContext.Items["jwt_token"] = context.Token;

            return Task.CompletedTask;
        },

        OnAuthenticationFailed = context =>
        {
            // get token from Items (set in OnMessageReceived) or fall back to header
            var tokenFromItems = context.HttpContext.Items.ContainsKey("jwt_token")
                ? context.HttpContext.Items["jwt_token"] as string
                : null;

            var rawHeader = context.Request.Headers["Authorization"].ToString();
            var token = tokenFromItems ?? (rawHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase)
                ? rawHeader.Substring("Bearer ".Length).Trim()
                : rawHeader);

            Console.Error.WriteLine($"[DEBUG] OnAuthenticationFailed - Exception: {context.Exception?.GetType().Name}: {context.Exception?.Message}");
            Console.Error.WriteLine($"[DEBUG] OnAuthenticationFailed - Raw Authorization header: '{rawHeader}'");
            Console.Error.WriteLine($"[DEBUG] OnAuthenticationFailed - resolved token: '{token}'");
            Console.Error.WriteLine($"[DEBUG] OnAuthenticationFailed - token length: {token?.Length ?? 0}, dot count: {token?.Count(ch => ch == '.') ?? 0}");
            if (!string.IsNullOrEmpty(token))
            {
                var first = token.Length > 20 ? token.Substring(0, 20) : token;
                var last = token.Length > 20 ? token.Substring(Math.Max(0, token.Length - 20)) : token;
                Console.Error.WriteLine($"[DEBUG] OnAuthenticationFailed - token first(20): '{first}'");
                Console.Error.WriteLine($"[DEBUG] OnAuthenticationFailed - token last(20): '{last}'");
                Console.Error.WriteLine($"[DEBUG] OnAuthenticationFailed - full exception: {context.Exception?.ToString()}");
            }

            return Task.CompletedTask;
        },

        OnTokenValidated = context =>
        {
            var claims = context.Principal?.Claims ?? Enumerable.Empty<Claim>();
            Console.WriteLine("Token validated. Claims:");
            foreach (var c in claims)
                Console.WriteLine($"  {c.Type} = {c.Value}");
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddHttpClient("LoggerService", client =>
{
    client.BaseAddress = new Uri("http://localhost:5194/");
});


var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AuthDbContext>();
    dbContext.Database.EnsureCreated();
    DbSeeder.SeedAdmin(dbContext);
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}



app.UseCors("AllowFrontend");

app.UseAuthentication();


app.UseAuthorization();

app.MapControllers();

app.Run();

