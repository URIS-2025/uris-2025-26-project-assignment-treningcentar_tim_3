using Microsoft.EntityFrameworkCore;
using MembershipService.Context;
using MembershipService.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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




app.Run();



