using LoggerService.Context;
using LoggerService.Data;
using LoggerService.Profiles;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<LoggerContext>();
builder.Services.AddScoped<ILoggerRepository, LoggerRepository>();

// ✅ AutoMapper ispravno za verziju 12+
builder.Services.AddAutoMapper(typeof(LoggerProfile));

builder.Services.AddCors();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(policy =>
    policy.WithOrigins("http://localhost:5173")
          .AllowAnyHeader()
          .AllowAnyMethod());

app.UseAuthorization();
app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<LoggerContext>();
    context.Database.EnsureCreated();
}

app.Run();

public partial class Program { }