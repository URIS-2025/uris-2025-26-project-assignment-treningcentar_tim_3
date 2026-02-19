using Microsoft.EntityFrameworkCore;
using PaymentService.Context;
using PaymentService.Data;
using PaymentService.Profiles;
using AutoMapper;



var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<PaymentContext>();
builder.Services.AddScoped<IPaymentRepository, PaymentRepository>();
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
