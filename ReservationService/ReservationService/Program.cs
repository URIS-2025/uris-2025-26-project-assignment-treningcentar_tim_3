using Microsoft.EntityFrameworkCore;
using ReservationService.Context;
using ReservationService.Data;
using ReservationService.ServiceCalls.User;

var builder = WebApplication.CreateBuilder(args);

// Registracija servisa
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddAutoMapper(typeof(Program));

// DbContext
builder.Services.AddDbContext<ReservationContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<ISessionRepository, SessionRepository>();
builder.Services.AddScoped<IUserService, UserService>(); 

builder.Services.AddCors();

var app = builder.Build();

// Middleware
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
    var context = scope.ServiceProvider.GetRequiredService<ReservationContext>();
    context.Database.EnsureCreated();
}

app.Run();