using Microsoft.EntityFrameworkCore;
using ReservationService.Context;
using ReservationService.Data;

var builder = WebApplication.CreateBuilder(args);

// Registracija servisa
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// DbContext
builder.Services.AddDbContext<ReservationContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("ReservationDB")));

// Registracija repository-ja
builder.Services.AddScoped<IReservationRepository, ReservationRepository>();

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

app.Run();