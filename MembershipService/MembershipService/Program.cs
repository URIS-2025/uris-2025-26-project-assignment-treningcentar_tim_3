using Microsoft.EntityFrameworkCore;
using MembershipService.Context;
using MembershipService.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using MembershipService.ServiceCalls.Auth;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// JWT Authentication
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
            Convert.FromBase64String(builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key is not configured"))),
        ClockSkew = TimeSpan.FromMinutes(5)
    };
});

builder.Services.AddAuthorization();

// Service calls - Auth Service
builder.Services.AddScoped<IAuthService, AuthService>();

// Registracija repozitorijuma
builder.Services.AddScoped<IMembershipRepository, MembershipRepository>();
//Automatsko mapiranje između entiteta i DTO-a
builder.Services.AddAutoMapper(config => config.AddMaps(typeof(Program).Assembly));
//DB
builder.Services.AddDbContext<MembershipContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("MembershipDB")));

var app = builder.Build();


// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();



