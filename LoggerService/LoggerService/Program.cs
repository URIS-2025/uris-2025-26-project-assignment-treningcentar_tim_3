using AutoMapper;
using LoggerService.Context;
using LoggerService.Data;
using LoggerService.Profiles;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<LoggerContext>();
builder.Services.AddScoped<ILoggerRepository, LoggerRepository>();

// AutoMapper ručno 
var loggerFactory = LoggerFactory.Create(_ => { });
var mapperConfig = new MapperConfiguration(cfg =>
{
    cfg.AddProfile(new LoggerProfile());
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