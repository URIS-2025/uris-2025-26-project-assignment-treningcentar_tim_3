using Microsoft.EntityFrameworkCore;
using ServiceService.Context;
using ServiceService.Data;
using ServiceService.Profiles;
using AutoMapper;
using Microsoft.Extensions.Logging;
using ServiceService.ServiceCalls.Measurement;
using ServiceService.ServiceCalls.Membership;
using ServiceService.ServiceCalls.Payment;
using ServiceService.ServiceCalls.Reservation;
using ServiceService.ServiceCalls.Logger;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ServiceContext>();
builder.Services.AddScoped<IServiceRepository, ServiceRepository>();

builder.Services.AddScoped<IReservationService, ReservationService>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<IMembershipService, MembershipService>();
builder.Services.AddScoped<IMeasurementService, MeasurementService>();

builder.Services.AddHttpClient<ILoggerService, LoggerService>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Services:LoggerService"]!);
    client.Timeout = TimeSpan.FromSeconds(2);
});

// ✅ AutoMapper (ispravno za verziju 12+ / .NET 8)
builder.Services.AddAutoMapper(typeof(ServiceProfile));

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
    var context = scope.ServiceProvider.GetRequiredService<ServiceContext>();
    context.Database.EnsureCreated();
}

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<ServiceContext>();
    context.Database.EnsureCreated();
}

app.Run();

public partial class Program { }