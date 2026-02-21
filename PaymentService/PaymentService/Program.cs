using Microsoft.EntityFrameworkCore;
using PaymentService.Context;
using PaymentService.Data;
using PaymentService.Profiles;
using PaymentService.Services.Stripe;
using PaymentService.Services.ServiceService;
using AutoMapper;
using Stripe;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<PaymentContext>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
builder.Services.AddScoped<IStripePaymentService, StripePaymentService>();
builder.Services.AddScoped<IServiceService, PaymentService.Services.ServiceService.ServiceService>();

// Konfiguracija Stripe API kljuca
StripeConfiguration.ApiKey = builder.Configuration["Stripe:SecretKey"];

var mapperConfig = new MapperConfiguration(cfg =>
{
    cfg.AddProfile(new PaymentProfile());
});
builder.Services.AddSingleton(mapperConfig.CreateMapper());

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
