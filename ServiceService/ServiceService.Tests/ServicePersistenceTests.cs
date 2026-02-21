using Microsoft.EntityFrameworkCore;
using ServiceService.Domain.Entities;
using ServiceService.Domain.Enums;
using ServiceService.Infrastructure.Persistence;
using Xunit;

public class ServicePersistenceTests
{
    private const string Conn =
        "Host=localhost;Port=5432;Database=service_service_db;Username=postgres;Password=soxil.nafez.dehoz";

    private static ServiceDbContext CreateDb()
    {
        var options = new DbContextOptionsBuilder<ServiceDbContext>()
            .UseNpgsql(Conn)
            .Options;

        return new ServiceDbContext(options);
    }

    [Fact]
    public async Task Insert_Service_Saves_To_Database()
    {
        await using var db = CreateDb();

        var uniqueName = "Test service " + Guid.NewGuid();

        var service = new Service
        {
            Name = uniqueName,
            Description = "desc",
            Price = 100,
            Category = ServiceCategory.Other
        };

        db.Services.Add(service);
        await db.SaveChangesAsync();

        var exists = await db.Services.AsNoTracking().AnyAsync(s => s.Name == uniqueName);
        Assert.True(exists);
    }

    [Fact]
    public async Task GetById_Returns_Inserted_Service()
    {
        await using var db = CreateDb();

        var uniqueName = "Test service " + Guid.NewGuid();

        var service = new Service
        {
            Name = uniqueName,
            Description = "desc",
            Price = 150,
            Category = ServiceCategory.Other
        };

        db.Services.Add(service);
        await db.SaveChangesAsync();

        var id = service.ServiceId;

        var loaded = await db.Services.AsNoTracking().FirstOrDefaultAsync(x => x.ServiceId == id);

        Assert.NotNull(loaded);
        Assert.Equal(uniqueName, loaded!.Name);
        Assert.Equal(150, loaded.Price);
    }

    [Fact]
    public async Task Update_Service_Changes_Are_Persisted()
    {
        await using var db = CreateDb();

        var uniqueName = "Test service " + Guid.NewGuid();

        var service = new Service
        {
            Name = uniqueName,
            Description = "desc",
            Price = 200,
            Category = ServiceCategory.Other
        };

        db.Services.Add(service);
        await db.SaveChangesAsync();

        // update
        service.Price = 999;
        service.Description = "updated";
        await db.SaveChangesAsync();

        var reloaded = await db.Services.AsNoTracking().FirstAsync(x => x.ServiceId == service.ServiceId);

        Assert.Equal(999, reloaded.Price);
        Assert.Equal("updated", reloaded.Description);
    }

    [Fact]
    public async Task Delete_Service_Removes_From_Database()
    {
        await using var db = CreateDb();

        var uniqueName = "Test service " + Guid.NewGuid();

        var service = new Service
        {
            Name = uniqueName,
            Description = "desc",
            Price = 300,
            Category = ServiceCategory.Other
        };

        db.Services.Add(service);
        await db.SaveChangesAsync();

        var id = service.ServiceId;

        db.Services.Remove(service);
        await db.SaveChangesAsync();

        var exists = await db.Services.AsNoTracking().AnyAsync(x => x.ServiceId == id);
        Assert.False(exists);
    }

    // provera UNIQUE constraint (Name)
    [Fact]
    public async Task Unique_Name_Constraint_Prevents_Duplicates()
    {
        await using var db = CreateDb();

        var name = "DuplicateName-" + Guid.NewGuid();

        var s1 = new Service
        {
            Name = name,
            Description = "desc1",
            Price = 100,
            Category = ServiceCategory.Other
        };

        var s2 = new Service
        {
            Name = name,
            Description = "desc2",
            Price = 200,
            Category = ServiceCategory.Other
        };

        db.Services.Add(s1);
        await db.SaveChangesAsync();

        db.Services.Add(s2);

        // ako SaveChanges pukne zbog UNIQUE
        await Assert.ThrowsAsync<DbUpdateException>(async () =>
        {
            await db.SaveChangesAsync();
        });
    }
}