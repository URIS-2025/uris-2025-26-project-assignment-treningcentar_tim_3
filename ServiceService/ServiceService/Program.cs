using Microsoft.EntityFrameworkCore;
using ServiceService.Context;
using ServiceService.Data;
using ServiceService.Profiles;
using AutoMapper;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<ServiceContext>();
builder.Services.AddScoped<IServiceRepository, ServiceRepository>();

// AutoMapper ali za verziju 16
var loggerFactory = LoggerFactory.Create(b => b.AddConsole());

var mapperConfig = new MapperConfiguration(cfg =>
{
    cfg.AddProfile(new ServiceProfile());
}, loggerFactory);

builder.Services.AddSingleton(mapperConfig.CreateMapper());

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();
app.Run();

public partial class Program { }