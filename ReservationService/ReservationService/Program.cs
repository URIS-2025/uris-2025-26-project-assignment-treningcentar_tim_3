using Microsoft.EntityFrameworkCore;
using ReservationService.Context;
using ReservationService.Data;
using ReservationService.ServiceCalls.Logger;
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

// Registracija repository-ja
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();
builder.Services.AddScoped<IUserService, UserService>(); 
builder.Services.AddScoped<IServiceLogger, ServiceLogger>();

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers(); 

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ReservationContext>();
    context.Database.EnsureCreated();
}

app.Run();